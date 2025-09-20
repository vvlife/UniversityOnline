import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { major, courses } = await request.json()

    if (!major || !courses || !Array.isArray(courses)) {
      return NextResponse.json({ error: "专业名称和课程列表是必需的" }, { status: 400 })
    }

    const coursesString = JSON.stringify(courses.sort())
    const { data: existingRecord } = await supabase
      .from("learning_records")
      .select("id")
      .eq("major", major)
      .eq("courses", coursesString)
      .single()

    if (existingRecord) {
      return NextResponse.json({
        success: true,
        recordId: existingRecord.id,
        message: "记录已存在",
      })
    }

    const { data, error } = await supabase
      .from("learning_records")
      .insert({
        major,
        courses: coursesString,
        votes: 0,
      })
      .select("id")
      .single()

    if (error) {
      console.error("保存记录失败:", error)
      return NextResponse.json({ error: "保存记录失败: " + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recordId: data.id,
    })
  } catch (error) {
    console.error("保存记录错误:", error)
    return NextResponse.json({ error: "服务器错误: " + (error as Error).message }, { status: 500 })
  }
}
