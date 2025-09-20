export interface Translations {
  // Header
  title: string
  subtitle: string
  tagline: string

  // Search
  searchTitle: string
  searchDescription: string
  searchPlaceholder: string
  searchButton: string
  searching: string
  newSearch: string

  // Course navigation
  backToCourses: string
  findFreeCourses: string
  startLearningFree: string

  // Status messages
  enterMajor: string
  searchFailed: string
  unknownError: string
  searchMoocFailed: string
  searchMoocError: string
  discoveringPath: string
  findingCourses: string

  // Course content
  learningPath: string
  freeResources: string
  discoverResources: string
  instructor: string
  rating: string
  noCoursesFound: string

  // Actions
  share: string
  explore: string

  // Popular records
  popularPaths: string
  votes: string
}

export const translations: Record<string, Translations> = {
  zh: {
    title: "University Online",
    subtitle: "For Free",
    tagline: "免费解锁知识 - 创建您的个性化学习路径",

    searchTitle: "找到您的学习路径",
    searchDescription: "输入任何学习领域：计算机科学、数据科学、心理学、工程学等",
    searchPlaceholder: "输入您感兴趣的领域...",
    searchButton: "探索",
    searching: "搜索中...",
    newSearch: "新搜索",

    backToCourses: "返回课程",
    findFreeCourses: "查找免费课程",
    startLearningFree: "开始免费学习",

    enterMajor: "请输入专业名称",
    searchFailed: "搜索专业大纲失败",
    unknownError: "发生未知错误",
    searchMoocFailed: "搜索MOOC课程失败",
    searchMoocError: "搜索MOOC课程时发生错误",
    discoveringPath: "正在发现您的学习路径...",
    findingCourses: "正在查找免费课程...",

    learningPath: "学习路径",
    freeResources: "免费学习资源",
    discoverResources: "发现来自顶级平台的免费在线课程",
    instructor: "讲师",
    rating: "评分",
    noCoursesFound: "暂时没有找到相关的免费课程。请尝试探索相关主题或稍后再试。",

    share: "分享",
    explore: "探索",

    popularPaths: "热门学习路径",
    votes: "票",
  },

  en: {
    title: "University Online",
    subtitle: "For Free",
    tagline: "Unlock Knowledge for Free - Create your personalized learning path",

    searchTitle: "Find Your Learning Path",
    searchDescription: "Enter any field of study: Computer Science, Data Science, Psychology, Engineering, etc.",
    searchPlaceholder: "Enter your field of interest...",
    searchButton: "Explore",
    searching: "Searching...",
    newSearch: "New Search",

    backToCourses: "Back to Courses",
    findFreeCourses: "Find Free Courses",
    startLearningFree: "Start Learning Free",

    enterMajor: "Please enter a major name",
    searchFailed: "Failed to search curriculum",
    unknownError: "Unknown error occurred",
    searchMoocFailed: "Failed to search MOOC courses",
    searchMoocError: "Error occurred while searching MOOC courses",
    discoveringPath: "Discovering your learning path...",
    findingCourses: "Finding free courses...",

    learningPath: "Learning Path",
    freeResources: "Free Learning Resources",
    discoverResources: "Discover free online courses from top platforms",
    instructor: "Instructor",
    rating: "Rating",
    noCoursesFound: "No free courses found at the moment. Try exploring related topics or check back later.",

    share: "Share",
    explore: "Explore",

    popularPaths: "Popular Learning Paths",
    votes: "votes",
  },
}

export function getTranslation(lang: string): Translations {
  return translations[lang] || translations.en
}
