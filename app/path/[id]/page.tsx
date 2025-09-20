"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookOpen, ExternalLink, GraduationCap, Share2, ArrowLeft, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

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

interface LearningRecord {
  id: string
  major: string
  courses: string[]
  votes: number
  created_at: string
}

export default function LearningPathPage() {
  const params = useParams()
  const pathId = params.id as string

  const [record, setRecord] = useState<LearningRecord | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [moocCourses, setMoocCourses] = useState<MOOCCourse[]>([])
  const [moocLoading, setMoocLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (pathId) {
      fetchRecord()
    }
  }, [pathId])

  const fetchRecord = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("正在获取学习路径:", pathId)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`/api/get-record/${pathId}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API响应:", data)

      if (data.success) {
        setRecord(data.record)
      } else {
        setError(data.error || "学习路径不存在")
      }
    } catch (err) {
      console.error("获取记录失败:", err)
      if (err.name === "AbortError") {
        setError("请求超时，请检查网络连接后重试")
      } else {
        setError("网络连接失败，请稍后重试")
      }
    } finally {
      setLoading(false)
    }
  }

  const searchMOOC = async (courseName: string) => {
    setSelectedCourse(courseName)
    setMoocLoading(true)
    setMoocCourses([])

    try {
      const response = await fetch("/api/search-mooc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseName, major: record?.major }),
      })

      if (!response.ok) {
        throw new Error("搜索MOOC课程失败")
      }

      const data = await response.json()
      setMoocCourses(data.courses)
    } catch (err) {
      setError(err instanceof Error ? err.message : "搜索MOOC课程时发生错误")
    } finally {
      setMoocLoading(false)
    }
  }

  const handleShare = async () => {
    const currentUrl = window.location.href

    try {
      await navigator.clipboard.writeText(currentUrl)

      const notification = document.createElement("div")
      notification.textContent = "✅ 学习路径链接已复制到剪贴板"
      notification.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300"
      document.body.appendChild(notification)

      setTimeout(() => {
        notification.style.opacity = "0"
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300)
      }, 2700)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  const backToCourseList = () => {
    setSelectedCourse(null)
    setMoocCourses([])
    setError("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg text-gray-600 dark:text-gray-300">正在加载学习路径...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error || "学习路径不存在"}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center space-x-4">
              <Button onClick={fetchRecord} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试加载
              </Button>
              <Link href="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{record.major} 学习路径</h1>
            </div>
          </div>
          <Button onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            分享路径
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="max-w-4xl mx-auto mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Course List */}
        {!selectedCourse && (
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-blue-600 dark:text-blue-400">{record.major} 专业课程大纲</CardTitle>
                <CardDescription className="text-base">
                  共 {record.courses.length} 门核心课程 • {record.votes} 人推荐 • 创建于{" "}
                  {new Date(record.created_at).toLocaleDateString("zh-CN")}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {record.courses.map((courseName, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => searchMOOC(courseName)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {courseName}
                    </CardTitle>
                    <CardDescription>点击查找相关的在线课程资源</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      查找MOOC课程
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
              <Button variant="outline" onClick={backToCourseList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回课程列表
              </Button>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-blue-600 dark:text-blue-400">
                  {selectedCourse} - MOOC课程推荐
                </CardTitle>
                <CardDescription>为"{selectedCourse}"课程找到的在线学习资源</CardDescription>
              </CardHeader>
            </Card>

            {moocLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg text-gray-600 dark:text-gray-300">正在搜索MOOC课程...</p>
              </div>
            ) : moocCourses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {moocCourses.map((mooc, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white line-clamp-2">{mooc.title}</h5>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          {mooc.platform}
                        </Badge>
                      </div>
                      {mooc.instructor && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">讲师：{mooc.instructor}</p>
                      )}
                      {mooc.rating && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">评分：{mooc.rating}/5.0</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => window.open(mooc.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        查看课程
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    暂未找到"{selectedCourse}"的相关MOOC课程，建议查看相关教材或其他学习资源
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
