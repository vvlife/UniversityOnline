import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { courseName, major, language = "zh" } = await request.json()

    if (!courseName) {
      return NextResponse.json({ error: "课程名称不能为空" }, { status: 400 })
    }

    const supabase = await createClient()

    // Try to get from cache
    const { data: cachedData, error: cacheError } = await supabase
      .from("course_cache")
      .select("*")
      .eq("course_name", courseName)
      .eq("major", major)
      .eq("language", language)
      .single()

    if (cachedData && !cacheError) {
      console.log(`[Cache Hit] Found cached data for course: ${courseName}`)
      return NextResponse.json({
        courseName,
        courses: cachedData.mooc_courses,
        textbooks: cachedData.textbooks || [],
        fromCache: true,
      })
    }

    console.log(`[Cache Miss] No cached data found for course: ${courseName}, searching...`)

    const BRAVE_API_KEY = process.env.BRAVE_API_KEY
    if (!BRAVE_API_KEY) {
      return NextResponse.json({ error: "API密钥未配置" }, { status: 500 })
    }

    const searchQueries = [
      `"${courseName}" MOOC 慕课 在线课程`,
      `"${courseName}" 中国大学MOOC 学堂在线 华文慕课`,
      `"${courseName}" 智慧树 超星尔雅 好大学在线`,
      `"${courseName}" Coursera edX Udacity FutureLearn`,
      `${major} "${courseName}" 网课 视频教程 在线学习`,
    ]

    const textbookQueries = [
      `"${courseName}" 教材 PDF 电子书`,
      `"${courseName}" textbook PDF download`,
      `${major} "${courseName}" 课本 PDF`,
    ]

    const allMoocCourses: Array<{
      title: string
      platform: string
      url: string
      instructor?: string
      rating?: number
    }> = []

    const allTextbooks: Array<{
      title: string
      url: string
      source: string
    }> = []

    // Search for MOOC courses
    for (const query of searchQueries) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`,
          {
            headers: {
              "X-Subscription-Token": BRAVE_API_KEY,
              Accept: "application/json",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          const moocCourses = extractMoocCoursesFromResults(data.web?.results || [], courseName)
          allMoocCourses.push(...moocCourses)
        }
      } catch (error) {
        console.error(`搜索MOOC查询 "${query}" 失败:`, error)
      }
    }

    for (const query of textbookQueries) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
          {
            headers: {
              "X-Subscription-Token": BRAVE_API_KEY,
              Accept: "application/json",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          const textbooks = extractTextbooksFromResults(data.web?.results || [], courseName)
          allTextbooks.push(...textbooks)
        }
      } catch (error) {
        console.error(`搜索教材查询 "${query}" 失败:`, error)
      }
    }

    const uniqueMoocCourses = removeDuplicateMoocCourses(allMoocCourses)
    const validCourses = uniqueMoocCourses.slice(0, 8)
    const uniqueTextbooks = removeDuplicateTextbooks(allTextbooks)
    const validTextbooks = uniqueTextbooks.slice(0, 5)

    try {
      await supabase.from("course_cache").upsert({
        course_name: courseName,
        major: major,
        language: language,
        mooc_courses: validCourses,
        textbooks: validTextbooks,
        updated_at: new Date().toISOString(),
      })
      console.log(`[Cache Save] Saved cache for course: ${courseName}`)
    } catch (cacheError) {
      console.error("Failed to save to cache:", cacheError)
      // Don't fail the request if cache save fails
    }

    return NextResponse.json({
      courseName,
      courses: validCourses,
      textbooks: validTextbooks,
      fromCache: false,
    })
  } catch (error) {
    console.error("搜索MOOC课程时发生错误:", error)
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}

function extractMoocCoursesFromResults(
  results: any[],
  courseName: string,
): Array<{
  title: string
  platform: string
  url: string
  instructor?: string
  rating?: number
}> {
  const moocCourses: Array<{
    title: string
    platform: string
    url: string
    instructor?: string
    rating?: number
  }> = []

  const moocPlatforms = {
    "icourse163.org": "中国大学MOOC",
    "xuetangx.com": "学堂在线",
    "coursera.org": "Coursera",
    "edx.org": "edX",
    "udacity.com": "Udacity",
    "udemy.com": "Udemy",
    "bilibili.com": "哔哩哔哩",
    "study.163.com": "网易云课堂",
    "ewant.org": "华文慕课",
    "zhihuishu.com": "智慧树",
    "chaoxing.com": "超星尔雅",
    "cnmooc.org": "好大学在线",
    "futurelearn.com": "FutureLearn",
    "swayam.gov.in": "SWAYAM",
    "france-universite-numerique-mooc.fr": "FUN MOOC",
    "iversity.org": "Iversity",
    "kadenze.com": "Kadenze",
    "canvas.net": "Canvas Network",
    "alison.com": "Alison",
    "skillshare.com": "Skillshare",
  }

  for (const result of results) {
    const url = result.url || ""
    const title = result.title || ""
    const description = result.description || ""

    const platform = Object.entries(moocPlatforms).find(([domain]) => url.includes(domain))?.[1]

    if (platform && isValidMoocCourse(title, description, courseName, url)) {
      moocCourses.push({
        title: cleanMoocTitle(title),
        platform,
        url,
        instructor: extractInstructor(description),
        rating: extractRating(description),
      })
    }
  }

  return moocCourses
}

function isValidMoocCourse(title: string, description: string, courseName: string, url: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  const courseKeywords = courseName.toLowerCase().split(/\s+/)

  const hasKeywords = courseKeywords.some((keyword) => keyword.length > 1 && text.includes(keyword))

  const invalidUrlPatterns = [
    /\/search/i,
    /\/category/i,
    /\/browse/i,
    /\/list/i,
    /\/tag/i,
    /\/subject/i,
    /\/directory/i,
  ]

  const invalidContentPatterns = [
    /招生|录取|考试|报名|学费/,
    /新闻|资讯|公告|通知/,
    /论坛|讨论|问答/,
    /搜索结果|相关课程|推荐课程/,
  ]

  const isValidUrl = !invalidUrlPatterns.some((pattern) => pattern.test(url))
  const isValidContent = !invalidContentPatterns.some((pattern) => pattern.test(text))

  return hasKeywords && isValidUrl && isValidContent
}

function cleanMoocTitle(title: string): string {
  return title
    .replace(/^\[.*?\]\s*/, "") // 移除开头的标签
    .replace(/\s*-\s*.*?MOOC.*$/i, "") // 移除平台后缀
    .trim()
}

function extractInstructor(description: string): string | undefined {
  const instructorMatch = description.match(/(?:讲师|教师|主讲|授课)[：:]?\s*([^，。；\n]{2,20})/i)
  return instructorMatch?.[1]?.trim()
}

function extractRating(description: string): number | undefined {
  const ratingMatch = description.match(/(?:评分|评价|星级)[：:]?\s*(\d+(?:\.\d+)?)/i)
  const rating = ratingMatch?.[1] ? Number.parseFloat(ratingMatch[1]) : undefined
  return rating && rating <= 5 ? rating : undefined
}

function removeDuplicateMoocCourses(
  courses: Array<{
    title: string
    platform: string
    url: string
    instructor?: string
    rating?: number
  }>,
): Array<{
  title: string
  platform: string
  url: string
  instructor?: string
  rating?: number
}> {
  const seen = new Set<string>()
  const unique: Array<{
    title: string
    platform: string
    url: string
    instructor?: string
    rating?: number
  }> = []

  for (const course of courses) {
    const key = `${course.title.toLowerCase()}-${course.platform}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(course)
    }
  }

  return unique
}

function extractTextbooksFromResults(
  results: any[],
  courseName: string,
): Array<{
  title: string
  url: string
  source: string
}> {
  const textbooks: Array<{
    title: string
    url: string
    source: string
  }> = []

  for (const result of results) {
    const url = result.url || ""
    const title = result.title || ""
    const description = result.description || ""

    // Only include direct PDF links
    if (url.toLowerCase().endsWith(".pdf") && isValidTextbook(title, description, courseName)) {
      const source = extractDomain(url)
      textbooks.push({
        title: cleanTextbookTitle(title),
        url,
        source,
      })
    }
  }

  return textbooks
}

function isValidTextbook(title: string, description: string, courseName: string): boolean {
  const text = `${title} ${description}`.toLowerCase()
  const courseKeywords = courseName.toLowerCase().split(/\s+/)

  const hasKeywords = courseKeywords.some((keyword) => keyword.length > 1 && text.includes(keyword))

  const invalidPatterns = [/搜索结果|相关文档|推荐资料/, /广告|招生|培训|考试/]

  const isValidContent = !invalidPatterns.some((pattern) => pattern.test(text))

  return hasKeywords && isValidContent
}

function cleanTextbookTitle(title: string): string {
  return title
    .replace(/\.pdf$/i, "")
    .replace(/^\[.*?\]\s*/, "")
    .trim()
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return "Unknown"
  }
}

function removeDuplicateTextbooks(
  textbooks: Array<{
    title: string
    url: string
    source: string
  }>,
): Array<{
  title: string
  url: string
  source: string
}> {
  const seen = new Set<string>()
  const unique: Array<{
    title: string
    url: string
    source: string
  }> = []

  for (const textbook of textbooks) {
    const key = textbook.url.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(textbook)
    }
  }

  return unique
}
