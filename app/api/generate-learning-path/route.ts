import { type NextRequest, NextResponse } from "next/server"

interface Course {
  name: string
  description: string
  moocCourses: MOOCCourse[]
}

interface MOOCCourse {
  title: string
  platform: string
  url: string
  instructor?: string
  rating?: number
}

interface LearningPath {
  major: string
  description: string
  courses: Course[]
}

// 搜索专业大纲
async function searchMajorCurriculum(major: string): Promise<string[]> {
  try {
    // 使用更精确的搜索关键词
    const searchQueries = [
      `${major} 专业课程设置 培养方案`,
      `${major} 本科课程体系 必修课程`,
      `${major} curriculum required courses university`,
      `${major} 学科课程 教学计划`,
    ]

    const allCourses = new Set<string>()

    for (const query of searchQueries) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
          {
            headers: {
              "X-Subscription-Token": process.env.BRAVE_API_KEY || "",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()

          data.web?.results?.forEach((result: any) => {
            const text = `${result.title} ${result.description}`

            // 提取课程名称的更精确方法
            const extractedCourses = extractCourseNames(text, major)
            extractedCourses.forEach((course) => {
              if (isValidCourseName(course)) {
                allCourses.add(course)
              }
            })
          })
        }
      } catch (error) {
        console.error(`搜索查询失败: ${query}`, error)
      }
    }

    // 如果没有找到足够的课程，返回一些通用的基础课程
    if (allCourses.size < 5) {
      const defaultCourses = getDefaultCourses(major)
      defaultCourses.forEach((course) => allCourses.add(course))
    }

    return Array.from(allCourses).slice(0, 8) // 限制返回8门课程
  } catch (error) {
    console.error("搜索专业大纲失败:", error)
    return getDefaultCourses(major)
  }
}

// 获取默认课程（当搜索失败时使用）
function getDefaultCourses(major: string): string[] {
  const majorLower = major.toLowerCase()

  if (majorLower.includes("计算机") || majorLower.includes("软件") || majorLower.includes("computer")) {
    return [
      "计算机科学导论",
      "程序设计基础",
      "数据结构与算法",
      "计算机组成原理",
      "操作系统",
      "数据库系统",
      "计算机网络",
      "软件工程",
    ]
  } else if (majorLower.includes("数据") || majorLower.includes("data")) {
    return ["数据科学导论", "统计学基础", "Python编程", "数据挖掘", "机器学习", "数据可视化", "大数据技术", "深度学习"]
  } else if (majorLower.includes("心理") || majorLower.includes("psychology")) {
    return [
      "普通心理学",
      "发展心理学",
      "社会心理学",
      "认知心理学",
      "心理统计学",
      "实验心理学",
      "心理测量学",
      "异常心理学",
    ]
  } else if (majorLower.includes("经济") || majorLower.includes("economics")) {
    return ["微观经济学", "宏观经济学", "计量经济学", "货币银行学", "国际经济学", "发展经济学", "产业经济学", "经济史"]
  } else {
    return [
      `${major}概论`,
      `${major}基础理论`,
      `${major}研究方法`,
      `${major}实践应用`,
      `${major}前沿发展`,
      `${major}案例分析`,
      `${major}专业技能`,
      `${major}综合实践`,
    ]
  }
}

// 搜索MOOC课程
async function searchMOOCCourses(courseName: string, major: string): Promise<MOOCCourse[]> {
  const moocCourses: MOOCCourse[] = []

  // 清理课程名称，移除可能影响搜索的字符
  const cleanCourseName = courseName.replace(/[《》""()（）]/g, "").trim()

  try {
    const searchQueries = [
      `"${cleanCourseName}" MOOC 慕课 site:icourse163.org`,
      `"${cleanCourseName}" 在线课程 site:xuetangx.com`,
      `"${cleanCourseName}" ${major} course site:coursera.org`,
      `"${cleanCourseName}" online course site:edx.org`,
      `${cleanCourseName} ${major} 网课 在线学习`,
    ]

    for (const query of searchQueries) {
      try {
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=6`,
          {
            headers: {
              "X-Subscription-Token": process.env.BRAVE_API_KEY || "",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()

          data.web?.results?.forEach((result: any) => {
            const url = result.url
            let platform = "其他平台"

            if (url.includes("icourse163.org") && (url.includes("/course/") || url.includes("/learn/"))) {
              platform = "中国大学MOOC"
            } else if (url.includes("xuetangx.com") && (url.includes("/courses/") || url.includes("/learn/"))) {
              platform = "学堂在线"
            } else if (url.includes("zhihuishu.com") && url.includes("/courseDetail")) {
              platform = "智慧树"
            } else if (url.includes("coursera.org") && (url.includes("/learn/") || url.includes("/specializations/"))) {
              platform = "Coursera"
            } else if (url.includes("edx.org") && url.includes("/course/")) {
              platform = "edX"
            } else if (url.includes("udacity.com") && url.includes("/course/")) {
              platform = "Udacity"
            } else {
              return // 跳过非课程页面
            }

            const isDuplicate = moocCourses.some(
              (existing) => existing.url === url || (existing.platform === platform && existing.title === result.title),
            )

            if (!isDuplicate && isRelevantCourse(result.title, cleanCourseName)) {
              moocCourses.push({
                title: result.title,
                platform,
                url: result.url,
                instructor: extractInstructor(result.description),
                rating: extractRating(result.description),
              })
            }
          })
        }
      } catch (error) {
        console.error(`MOOC搜索失败: ${query}`, error)
      }
    }

    // 如果没有找到相关课程，提供搜索链接
    if (moocCourses.length === 0) {
      const searchLinks = generateSearchLinks(cleanCourseName, major)
      moocCourses.push(...searchLinks)
    }

    return moocCourses.slice(0, 3) // 每门课程最多返回3个MOOC课程
  } catch (error) {
    console.error("搜索MOOC课程失败:", error)
    return generateSearchLinks(cleanCourseName, major)
  }
}

function extractCourseNames(text: string, major: string): string[] {
  const courses: string[] = []

  // 常见的课程关键词
  const courseKeywords = [
    "数学",
    "物理",
    "化学",
    "生物",
    "计算机",
    "编程",
    "算法",
    "数据结构",
    "机器学习",
    "人工智能",
    "统计",
    "概率",
    "线性代数",
    "微积分",
    "离散数学",
    "操作系统",
    "数据库",
    "网络",
    "软件工程",
    "心理学",
    "经济学",
    "管理学",
    "会计",
    "金融",
    "市场营销",
    "法学",
    "哲学",
    "文学",
    "历史",
    "政治",
    "社会学",
    "教育学",
    "医学",
    "工程",
    "建筑",
    "设计",
    "艺术",
    "语言学",
    "基础",
    "概论",
    "原理",
    "导论",
    "入门",
    "进阶",
    "高级",
    "实践",
    "实验",
    "项目",
    "设计",
    "分析",
    "理论",
    "方法",
    "技术",
    "系统",
    "应用",
  ]

  // 更精确的正则表达式模式
  const patterns = [
    // 匹配 "课程名称" 或 《课程名称》
    /[《""]([^》""]{3,20})[》""]/g,
    // 匹配包含课程关键词的短语
    /([^\s，。；！？\n]{2,15}(?:数学|物理|化学|生物|计算机|编程|算法|数据结构|机器学习|人工智能|统计|概率|线性代数|微积分|离散数学|操作系统|数据库|网络|软件工程|心理学|经济学|管理学|会计|金融|市场营销|法学|哲学|文学|历史|政治|社会学|教育学|医学|工程|建筑|设计|艺术|语言学)[^\s，。；！？\n]{0,10})/g,
    // 匹配以课程后缀结尾的词组
    /([^\s，。；！？\n]{2,15}(?:基础|概论|原理|导论|入门|进阶|高级|实践|实验|项目|设计|分析|理论|方法|技术|系统|应用))/g,
  ]

  patterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        const cleanMatch = match.replace(/[《》""]/g, "").trim()
        if (cleanMatch.length >= 3 && cleanMatch.length <= 20) {
          courses.push(cleanMatch)
        }
      })
    }
  })

  return courses
}

function isValidCourseName(courseName: string): boolean {
  // 过滤掉无效的课程名称
  const invalidPatterns = [
    /^[0-9]+$/, // 纯数字
    /^[a-zA-Z]+$/, // 纯英文字母
    /专业|学院|大学|学校|系部|招生|就业|毕业|学位|证书/, // 包含学校相关词汇
    /网站|链接|地址|电话|邮箱|QQ|微信/, // 包含联系方式
    /年|月|日|时间|地点|地址/, // 包含时间地点
    /价格|费用|收费|免费|优惠/, // 包含价格信息
    /点击|查看|详情|更多|登录|注册/, // 包含操作词汇
  ]

  // 检查是否包含无效模式
  for (const pattern of invalidPatterns) {
    if (pattern.test(courseName)) {
      return false
    }
  }

  // 检查长度是否合理
  if (courseName.length < 3 || courseName.length > 25) {
    return false
  }

  // 检查是否包含至少一个中文字符或有意义的英文词汇
  const hasValidContent =
    /[\u4e00-\u9fff]/.test(courseName) ||
    /(?:math|physics|chemistry|biology|computer|programming|algorithm|data|machine|learning|statistics|psychology|economics|management|accounting|finance|marketing|law|philosophy|literature|history|politics|sociology|education|medicine|engineering|architecture|design|art)/i.test(
      courseName,
    )

  return hasValidContent
}

function isRelevantCourse(title: string, courseName: string): boolean {
  const titleLower = title.toLowerCase()
  const courseNameLower = courseName.toLowerCase()

  // 检查标题是否包含课程名称的关键词
  const courseWords = courseNameLower.split(/\s+/)
  const relevantWords = courseWords.filter((word) => word.length > 1)

  if (relevantWords.length === 0) return true

  // 至少包含一个关键词才认为相关
  return relevantWords.some((word) => titleLower.includes(word))
}

function generateSearchLinks(courseName: string, major: string): MOOCCourse[] {
  const encodedCourse = encodeURIComponent(courseName)
  const encodedMajor = encodeURIComponent(major)

  return [
    {
      title: `在中国大学MOOC搜索"${courseName}"`,
      platform: "中国大学MOOC",
      url: `https://www.icourse163.org/search.htm?search=${encodedCourse}`,
      instructor: "多位知名教授",
    },
    {
      title: `在学堂在线搜索"${courseName}"`,
      platform: "学堂在线",
      url: `https://www.xuetangx.com/search?query=${encodedCourse}`,
      instructor: "清华北大等名校教师",
    },
    {
      title: `Search "${courseName}" on Coursera`,
      platform: "Coursera",
      url: `https://www.coursera.org/search?query=${encodedCourse}%20${encodedMajor}`,
      instructor: "University Professors",
    },
  ]
}

// 从描述中提取讲师信息
function extractInstructor(description: string): string | undefined {
  const instructorPatterns = [
    /讲师[：:]\s*([^，。；\n]+)/,
    /教授[：:]\s*([^，。；\n]+)/,
    /主讲[：:]\s*([^，。；\n]+)/,
    /Instructor[：:]\s*([^，。；\n]+)/i,
    /Professor[：:]\s*([^，。；\n]+)/i,
  ]

  for (const pattern of instructorPatterns) {
    const match = description.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return undefined
}

// 从描述中提取评分信息
function extractRating(description: string): number | undefined {
  const ratingPattern = /(\d+\.?\d*)\s*[分/]\s*5|(\d+\.?\d*)\s*stars?/i
  const match = description.match(ratingPattern)

  if (match) {
    const rating = Number.parseFloat(match[1] || match[2])
    if (rating >= 0 && rating <= 5) {
      return rating
    }
  }

  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const { major } = await request.json()

    if (!major || typeof major !== "string") {
      return NextResponse.json({ error: "请提供有效的专业名称" }, { status: 400 })
    }

    // 搜索专业课程大纲
    const courseNames = await searchMajorCurriculum(major)

    // 为每门课程搜索对应的MOOC课程
    const courses: Course[] = []

    for (const courseName of courseNames) {
      const moocCourses = await searchMOOCCourses(courseName, major)

      courses.push({
        name: courseName,
        description: `${courseName}是${major}专业的重要课程，涵盖该领域的核心理论和实践知识。`,
        moocCourses,
      })
    }

    const learningPath: LearningPath = {
      major,
      description: `${major}专业的完整学习路径，包含核心课程和推荐的在线学习资源。建议按顺序学习，每门课程都有对应的MOOC课程可供选择。`,
      courses,
    }

    return NextResponse.json(learningPath)
  } catch (error) {
    console.error("生成学习路径失败:", error)
    return NextResponse.json({ error: "生成学习路径时发生错误，请稍后重试" }, { status: 500 })
  }
}
