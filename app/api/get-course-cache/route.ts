import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseName = searchParams.get("courseName")
    const major = searchParams.get("major")
    const language = searchParams.get("language")

    if (!courseName || !major || !language) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("course_cache")
      .select("*")
      .eq("course_name", courseName)
      .eq("major", major)
      .eq("language", language)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("获取课程缓存失败:", error)
      return NextResponse.json({ error: "获取缓存失败" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cache: data || null,
    })
  } catch (error) {
    console.error("获取课程缓存错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
