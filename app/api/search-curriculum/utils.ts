export async function extractCoursesWithAI(
  searchResults: string,
  major: string,
  language = "zh",
): Promise<Array<{ name: string; description: string }>> {
  let retryCount = 0
  const maxRetries = 3

  while (retryCount <= maxRetries) {
    try {
      console.log(`调用SiliconFlow API提取课程 (第${retryCount + 1}次)`)

      if (retryCount > 0) {
        const delay = Math.min(5000 * Math.pow(2, retryCount), 30000)
        console.log(`等待 ${delay}ms 后重试AI调用...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const systemPrompt =
        language === "zh"
          ? `你是一个专业的教育课程分析专家。请从给定的搜索结果中提取${major}专业的核心课程列表。

要求：
1. 只提取真正的课程名称，不要包含无关信息
2. 课程名称要准确、简洁
3. 为每门课程提供简短的描述
4. 必须返回纯JSON格式，不要包含任何markdown标记或代码块
5. 格式：[{"name": "课程名称", "description": "课程描述"}]
6. 最多返回12门课程
7. 过滤掉重复的课程

重要：直接返回JSON数组，不要用\`\`\`json包围，不要添加任何解释文字。`
          : `You are a professional educational curriculum analyst. Please extract the core course list for ${major} major from the given search results.

Requirements:
1. Extract only real course names, no irrelevant information
2. Course names should be accurate and concise
3. Provide brief descriptions for each course
4. Must return pure JSON format, no markdown tags or code blocks
5. Format: [{"name": "Course Name", "description": "Course Description"}]
6. Maximum 12 courses
7. Filter out duplicate courses

Important: Return JSON array directly, do not wrap with \`\`\`json, do not add any explanatory text.`

      const userPrompt =
        language === "zh"
          ? `请从以下搜索结果中提取${major}专业的课程列表：\n\n${searchResults.slice(0, 2500)}`
          : `Please extract the course list for ${major} major from the following search results:\n\n${searchResults.slice(0, 2500)}`

      const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-7B-Instruct", // 使用正确的模型名称
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1500,
          stream: false, // 明确指定不使用流式响应
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("SiliconFlow API 调用失败:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })

        if (response.status === 400) {
          console.error("请求格式错误，可能是模型名称或参数不正确")
        } else if (response.status === 401) {
          console.error("API密钥无效或未配置")
        } else if (response.status === 429) {
          const waitTime = Math.min(15000 * Math.pow(2, retryCount), 120000)
          console.log(`AI API遇到速率限制，等待 ${waitTime}ms...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          retryCount++
          continue
        }

        return []
      }

      const data = await response.json()
      let content = data.choices?.[0]?.message?.content

      if (!content) {
        console.error("AI响应为空")
        return []
      }

      console.log("AI响应:", content.slice(0, 200) + "...")

      content = content.trim()

      // 移除可能的代码块标记
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      content = content.trim()

      try {
        const courses = JSON.parse(content)
        if (Array.isArray(courses)) {
          const validCourses = courses.filter(
            (course) =>
              course.name &&
              course.description &&
              typeof course.name === "string" &&
              typeof course.description === "string" &&
              course.name.length > 1 &&
              course.name.length < 50,
          )

          console.log(`成功提取 ${validCourses.length} 门课程`)
          return validCourses
        } else {
          console.error("AI响应不是数组格式:", typeof courses)
          return []
        }
      } catch (parseError) {
        console.error("解析AI响应失败:", parseError)
        console.error("清理后的响应:", content)

        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          try {
            const courses = JSON.parse(jsonMatch[0])
            if (Array.isArray(courses)) {
              const validCourses = courses.filter(
                (course) =>
                  course.name &&
                  course.description &&
                  typeof course.name === "string" &&
                  typeof course.description === "string" &&
                  course.name.length > 1 &&
                  course.name.length < 50,
              )
              console.log(`从匹配中成功提取 ${validCourses.length} 门课程`)
              return validCourses
            }
          } catch (secondParseError) {
            console.error("二次解析也失败:", secondParseError)
          }
        }
      }

      return []
    } catch (error) {
      console.error(`调用SiliconFlow API时发生错误 (第${retryCount + 1}次):`, error)

      if (error.name === "AbortError") {
        console.error("AI API请求超时")
      }

      retryCount++
      if (retryCount <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    }
  }

  return []
}

export function extractMajorDescription(results: any[], major: string): string {
  for (const result of results) {
    const text = result.description || result.title || ""
    if (text.includes(major) && text.length > 20) {
      return text.slice(0, 200) + (text.length > 200 ? "..." : "")
    }
  }
  return ""
}
