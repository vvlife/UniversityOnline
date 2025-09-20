import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { courseName, major, language, moocCourses, textbooks } = await request.json()

    if (!courseName || !major || !language) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("course_cache")
      .upsert({
        course_name: courseName,
        major: major,
        language: language,
        mooc_courses: moocCourses || [],
        textbooks: textbooks || [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("保存课程缓存失败:", error)
      return NextResponse.json({ error: "保存缓存失败" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cache: data,
    })
  } catch (error) {
    console.error("保存课程缓存错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
