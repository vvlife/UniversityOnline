import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractCoursesWithAI, extractMajorDescription } from "./utils"
// Declare the language variable
let language: string

export async function POST(request: NextRequest) {
  try {
    const { major, languageParam = "zh" } = await request.json()
    language = languageParam // Assign the language variable

    if (!major) {
      const errorMsg = language === "zh" ? "专业名称不能为空" : "Major name cannot be empty"
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const BRAVE_API_KEY = process.env.BRAVE_API_KEY
    const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY

    if (!BRAVE_API_KEY) {
      const errorMsg = language === "zh" ? "Brave API密钥未配置" : "Brave API key not configured"
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    if (!SILICONFLOW_API_KEY) {
      const errorMsg = language === "zh" ? "SiliconFlow API密钥未配置" : "SiliconFlow API key not configured"
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    const searchQueries =
      language === "zh"
        ? [
            `${major} 专业课程设置 课程大纲`,
            `${major} 专业培养方案 课程体系`,
            `${major} curriculum courses syllabus`,
            `${major} 专业核心课程 必修课程`,
          ]
        : [
            `${major} curriculum courses syllabus`,
            `${major} degree program course structure`,
            `${major} major courses requirements`,
            `${major} academic program curriculum`,
          ]

    let allSearchResults = ""
    let majorDescription = ""
    let successfulSearches = 0

    for (const query of searchQueries) {
      let retryCount = 0
      const maxRetries = 3

      while (retryCount <= maxRetries) {
        try {
          console.log(`尝试搜索: ${query} (第${retryCount + 1}次)`)

          if (retryCount > 0 || successfulSearches > 0) {
            const delay = Math.min(5000 * Math.pow(2, retryCount), 30000)
            console.log(`等待 ${delay}ms 后重试...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)

          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`,
            {
              headers: {
                "X-Subscription-Token": BRAVE_API_KEY,
                Accept: "application/json",
                "User-Agent": "LearningPath/1.0",
              },
              signal: controller.signal,
            },
          )

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            const results = data.web?.results || []

            console.log(`搜索成功，获得 ${results.length} 个结果`)

            for (const result of results) {
              if (result.title && result.description) {
                allSearchResults += `${result.title} ${result.description} `
              }
            }

            if (!majorDescription && results.length > 0) {
              majorDescription = extractMajorDescription(results, major)
            }

            successfulSearches++
            break
          } else {
            console.error(`搜索API返回错误状态: ${response.status}`)
            const errorText = await response.text()
            console.error(`错误详情: ${errorText}`)

            if (response.status === 429) {
              const waitTime = Math.min(10000 * Math.pow(2, retryCount), 60000)
              console.log(`遇到速率限制，等待 ${waitTime}ms...`)
              await new Promise((resolve) => setTimeout(resolve, waitTime))
            } else if (response.status >= 500) {
              await new Promise((resolve) => setTimeout(resolve, 3000))
            } else {
              break
            }
          }
        } catch (error) {
          console.error(`搜索查询 "${query}" 失败 (第${retryCount + 1}次):`, error)

          if (error.name === "AbortError") {
            console.error("请求超时")
          }
        }

        retryCount++
      }

      if (successfulSearches < searchQueries.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    if (!allSearchResults.trim()) {
      const errorMsg =
        language === "zh"
          ? `由于API速率限制，暂时无法获取"${major}"专业的课程信息。请稍等片刻后重试。`
          : `Due to API rate limits, unable to retrieve course information for "${major}" at the moment. Please try again later.`
      return NextResponse.json({ error: errorMsg }, { status: 429 })
    }

    console.log(`成功完成 ${successfulSearches} 个搜索查询，开始提取课程`)

    const courses = await extractCoursesWithAI(allSearchResults, major, language)

    if (courses.length === 0) {
      const errorMsg =
        language === "zh"
          ? `未能从搜索结果中提取到"${major}"专业的有效课程信息`
          : `Unable to extract valid course information for "${major}" from search results`
      return NextResponse.json({ error: errorMsg }, { status: 404 })
    }

    try {
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      await supabase.from("learning_records").insert({
        major,
        courses: courses.map((course) => ({ name: course.name, description: course.description })), // 保存完整的课程对象数组
        votes: 0,
      })

      console.log("记录保存成功")
    } catch (saveError) {
      console.error("保存记录失败:", saveError)
    }

    const defaultDescription =
      language === "zh"
        ? `${major}专业的核心课程体系，涵盖理论基础和实践应用。`
        : `Core curriculum for ${major}, covering theoretical foundations and practical applications.`

    return NextResponse.json({
      major,
      description: majorDescription || defaultDescription,
      courses: courses.slice(0, 15),
    })
  } catch (error) {
    console.error("搜索专业大纲时发生错误:", error)
    const errorMsg = language === "zh" ? "服务器内部错误，请稍后重试" : "Internal server error, please try again later"
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
