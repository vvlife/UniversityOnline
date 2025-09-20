"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, BookOpen, ExternalLink, GraduationCap, ArrowLeft, Share2, Zap, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import LearningRecords from "@/components/learning-records"
import LanguageSwitcher from "@/components/language-switcher"
import { getTranslation, type Translations } from "@/lib/i18n"

interface Course {
  name: string
  description: string
}

interface MOOCCourse {
  title: string
  platform: string
  url: string
  instructor?: string
  rating?: number
}

interface Textbook {
  title: string
  url: string
  source: string
}

interface Curriculum {
  major: string
  description: string
  courses: Course[]
}

interface LearningRecord {
  major: string
  courses: (string | Course)[]
}

export default function LearningPathGenerator() {
  const [language, setLanguage] = useState("zh")
  const [t, setT] = useState<Translations>(getTranslation("zh"))
  const [major, setMajor] = useState("")
  const [loading, setLoading] = useState(false)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [moocCourses, setMoocCourses] = useState<MOOCCourse[]>([])
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [moocLoading, setMoocLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "zh"
    setLanguage(savedLang)
    setT(getTranslation(savedLang))
  }, [])

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setT(getTranslation(lang))
    localStorage.setItem("language", lang)
  }

  const searchCurriculum = async () => {
    if (!major.trim()) {
      setError(t.enterMajor)
      return
    }

    setLoading(true)
    setError("")
    setCurriculum(null)

    try {
      const response = await fetch("/api/search-curriculum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ major: major.trim(), language }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t.searchFailed)
      }

      const data = await response.json()
      setCurriculum(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unknownError)
    } finally {
      setLoading(false)
    }
  }

  const searchMOOC = async (courseName: string) => {
    setSelectedCourse(courseName)
    setMoocLoading(true)
    setMoocCourses([])
    setTextbooks([])
    setFromCache(false)

    try {
      const response = await fetch("/api/search-mooc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseName, major, language }),
      })

      if (!response.ok) {
        throw new Error(t.searchMoocFailed)
      }

      const data = await response.json()
      setMoocCourses(data.courses)
      setTextbooks(data.textbooks || [])
      setFromCache(data.fromCache || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.searchMoocError)
    } finally {
      setMoocLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchCurriculum()
  }

  const resetToSearch = () => {
    setCurriculum(null)
    setSelectedCourse(null)
    setMoocCourses([])
    setTextbooks([])
    setFromCache(false)
    setMajor("")
    setError("")
  }

  const backToCurriculum = () => {
    setSelectedCourse(null)
    setMoocCourses([])
    setTextbooks([])
    setFromCache(false)
    setError("")
  }

  const handleRecordClick = (record: LearningRecord) => {
    const curriculumData: Curriculum = {
      major: record.major,
      description: `${record.major}${language === "zh" ? "专业课程大纲" : " Curriculum"}`,
      courses: Array.isArray(record.courses)
        ? record.courses.map((course) => {
            // 如果是新格式（对象），直接使用；如果是旧格式（字符串），转换为对象
            if (typeof course === "object" && course.name && course.description) {
              return course
            } else if (typeof course === "string") {
              return {
                name: course,
                description: `${course}${language === "zh" ? "相关课程内容" : " course content"}`,
              }
            }
            return {
              name: String(course),
              description: `${String(course)}${language === "zh" ? "相关课程内容" : " course content"}`,
            }
          })
        : [],
    }

    setCurriculum(curriculumData)
    setMajor(record.major)
    setError("")
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // 这里可以添加toast通知
    } catch (err) {
      console.error("分享失败:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900 dark:to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <LanguageSwitcher currentLang={language} onLanguageChange={handleLanguageChange} />
            {(curriculum || selectedCourse) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t.share}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <GraduationCap className="h-10 w-10 text-blue-600" />
              <Zap className="h-4 w-4 text-cyan-500 absolute -top-1 -right-1" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-serif">{t.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">{t.subtitle}</span>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                  Beta
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-sans">
            {!curriculum
              ? t.tagline
              : selectedCourse
                ? `${t.discoverResources} "${selectedCourse}"`
                : language === "zh"
                  ? "点击任何课程来探索免费学习机会"
                  : "Click on any course to explore free learning opportunities"}
          </p>
        </div>

        {/* Search Form - Only show when no curriculum */}
        {!curriculum && (
          <Card className="max-w-2xl mx-auto mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 font-serif">
                <Search className="h-5 w-5 text-blue-600" />
                {t.searchTitle}
              </CardTitle>
              <CardDescription className="font-sans">{t.searchDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-4">
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="flex-1 bg-white/50 border-slate-200 focus:border-blue-500 font-sans"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !major.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-sans"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t.searching}
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      {t.explore}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {!curriculum && !loading && (
          <div className="max-w-4xl mx-auto mb-8">
            <LearningRecords onRecordClick={handleRecordClick} language={language} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="max-w-2xl mx-auto mb-8 border-red-200 bg-red-50/80 backdrop-blur-sm dark:border-red-800 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200 font-sans">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg text-slate-600 dark:text-slate-300 font-sans">{t.discoveringPath}</p>
          </div>
        )}

        {/* Curriculum Results */}
        {curriculum && !selectedCourse && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={resetToSearch} className="bg-white/80 backdrop-blur-sm font-sans">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.newSearch}
              </Button>
            </div>

            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600 dark:text-blue-400 font-serif">
                  {curriculum.major} {t.learningPath}
                </CardTitle>
                <CardDescription className="text-base font-sans">{curriculum.description}</CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {curriculum.courses.map((course, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white/90"
                  onClick={() => searchMOOC(course.name)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-serif text-slate-900">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {course.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 font-sans">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent hover:bg-blue-50 font-sans">
                      <Search className="h-4 w-4 mr-2" />
                      {t.findFreeCourses}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MOOC Search Results */}
        {selectedCourse && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={backToCurriculum} className="bg-white/80 backdrop-blur-sm font-sans">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.backToCourses}
              </Button>
              {fromCache && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {language === "zh" ? "🚀 缓存加速" : "🚀 Cache Accelerated"}
                </Badge>
              )}
            </div>

            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-blue-600 dark:text-blue-400 font-serif">
                  {selectedCourse} - {t.freeResources}
                </CardTitle>
                <CardDescription className="font-sans">
                  {t.discoverResources} "{selectedCourse}"
                </CardDescription>
              </CardHeader>
            </Card>

            {moocLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg text-slate-600 dark:text-slate-300 font-sans">{t.findingCourses}</p>
              </div>
            ) : moocCourses.length > 0 || textbooks.length > 0 ? (
              <div className="space-y-8">
                {moocCourses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 font-serif">
                      {language === "zh" ? "在线课程" : "Online Courses"}
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {moocCourses.map((mooc, index) => (
                        <Card
                          key={index}
                          className="hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-slate-900 dark:text-white line-clamp-2 font-sans">
                                {mooc.title}
                              </h5>
                              <Badge variant="secondary" className="ml-2 shrink-0 bg-cyan-100 text-cyan-700">
                                {mooc.platform}
                              </Badge>
                            </div>
                            {mooc.instructor && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-sans">
                                {t.instructor}: {mooc.instructor}
                              </p>
                            )}
                            {mooc.rating && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-sans">
                                {t.rating}: {mooc.rating}/5.0
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-transparent hover:bg-blue-50 font-sans"
                              onClick={() => window.open(mooc.url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {t.startLearningFree}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {textbooks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 font-serif">
                      {language === "zh" ? "相关教材" : "Related Textbooks"}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {textbooks.map((textbook, index) => (
                        <Card
                          key={index}
                          className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-md"
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-red-600 mt-1 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h6 className="font-medium text-slate-900 text-sm line-clamp-2 mb-2 font-sans">
                                  {textbook.title}
                                </h6>
                                <p className="text-xs text-slate-500 mb-3 font-sans">
                                  {language === "zh" ? "来源" : "Source"}: {textbook.source}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs bg-transparent hover:bg-red-50 font-sans"
                                  onClick={() => window.open(textbook.url, "_blank")}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {language === "zh" ? "打开PDF" : "Open PDF"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-500 dark:text-slate-400 italic font-sans">
                    {t.noCoursesFound.replace('"{selectedCourse}"', `"${selectedCourse}"`)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
