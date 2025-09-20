"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, Share2, Calendar } from "lucide-react"
import type { LearningRecord } from "@/lib/supabase/client"
import { getTranslation } from "@/lib/i18n"

interface LearningRecordsProps {
  onRecordClick?: (record: LearningRecord) => void
  language: string
}

export default function LearningRecords({ onRecordClick, language }: LearningRecordsProps) {
  const [records, setRecords] = useState<LearningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set())
  const t = getTranslation(language)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/get-records")
      const data = await response.json()

      if (data.success) {
        setRecords(data.records)
      }
    } catch (error) {
      console.error(language === "zh" ? "获取记录失败:" : "Failed to fetch records:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (votingIds.has(recordId)) return

    setVotingIds((prev) => new Set(prev).add(recordId))

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordId }),
      })

      const data = await response.json()

      if (data.success) {
        setRecords((prev) =>
          prev
            .map((record) => (record.id === recordId ? { ...record, votes: data.votes } : record))
            .sort((a, b) => b.votes - a.votes),
        )
      }
    } catch (error) {
      console.error(language === "zh" ? "投票失败:" : "Vote failed:", error)
    } finally {
      setVotingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(recordId)
        return newSet
      })
    }
  }

  const handleShare = async (record: LearningRecord, e: React.MouseEvent) => {
    e.stopPropagation()

    const shareUrl = `${window.location.origin}/path/${record.id}`

    try {
      await navigator.clipboard.writeText(shareUrl)

      const notification = document.createElement("div")
      notification.textContent =
        language === "zh" ? "✅ 学习路径链接已复制到剪贴板" : "✅ Learning path link copied to clipboard"
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
      console.error(language === "zh" ? "复制失败:" : "Copy failed:", error)

      const fallbackDiv = document.createElement("div")
      fallbackDiv.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 class="font-semibold mb-3">${language === "zh" ? "分享学习路径" : "Share Learning Path"}</h3>
            <input readonly class="w-full p-3 border rounded-lg text-sm" value="${shareUrl}" onclick="this.select()" />
            <div class="flex gap-2 mt-4">
              <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 bg-gray-200 rounded-lg">${language === "zh" ? "关闭" : "Close"}</button>
              <button onclick="navigator.clipboard.writeText('${shareUrl}').then(() => { this.textContent = '${language === "zh" ? "已复制!" : "Copied!"}'; setTimeout(() => this.closest('.fixed').remove(), 1000) })" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">${language === "zh" ? "复制链接" : "Copy Link"}</button>
            </div>
          </div>
        </div>
      `
      document.body.appendChild(fallbackDiv)
    }
  }

  const handleRecordClick = (record: LearningRecord) => {
    if (onRecordClick) {
      onRecordClick(record)
    }
  }

  const getCourseName = (course: string | { name: string; description: string }): string => {
    return typeof course === "string" ? course : course.name
  }

  const getCourseCount = (courses: (string | { name: string; description: string })[]): number => {
    return courses.length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">{t.popularPaths}</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{language === "zh" ? "暂无学习路径记录" : "No learning path records yet"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{t.popularPaths}</h2>
      <div className="space-y-3">
        {records.map((record, index) => (
          <Card
            key={record.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleRecordClick(record)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{record.major}</h3>
                    {index < 3 && (
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0
                          ? language === "zh"
                            ? "🏆 热门"
                            : "🏆 Popular"
                          : index === 1
                            ? language === "zh"
                              ? "🥈 推荐"
                              : "🥈 Recommended"
                            : language === "zh"
                              ? "🥉 精选"
                              : "🥉 Featured"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {record.courses.slice(0, 6).map((course, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {getCourseName(course)}
                      </Badge>
                    ))}
                    {record.courses.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{record.courses.length - 6}
                        {language === "zh" ? "门" : " more"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(record.created_at).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                    </div>
                    <span>
                      {getCourseCount(record.courses)}
                      {language === "zh" ? "门课程" : " courses"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={(e) => handleShare(record, e)} className="h-8 w-8 p-0">
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleVote(record.id, e)}
                    disabled={votingIds.has(record.id)}
                    className="flex items-center gap-1 h-8 px-2"
                  >
                    <ChevronUp className="h-3 w-3" />
                    <span className="text-xs font-medium">{record.votes}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
