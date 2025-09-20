import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabaseServer } from "@/lib/supabase/server"

interface SharePageProps {
  params: {
    id: string
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { data: record, error } = await supabaseServer.from("learning_records").select("*").eq("id", params.id).single()

  if (error || !record) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl font-bold">{record.major}</CardTitle>
            <div className="flex items-center gap-4 text-blue-100 mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(record.created_at).toLocaleDateString("zh-CN")}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {record.courses.length}门课程
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {record.votes}人推荐
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">课程列表</h3>
              <div className="grid gap-2">
                {record.courses.map((course, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline" className="min-w-fit">
                      {index + 1}
                    </Badge>
                    <span className="text-gray-700">{course}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 text-center">
                这个学习路径由 LearningPath 智能生成，帮助你系统学习{record.major}专业知识
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
