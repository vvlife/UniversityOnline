import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("learning_records")
      .select("*")
      .order("votes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("获取记录失败:", error)
      return NextResponse.json({ error: "获取记录失败" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      records: data,
    })
  } catch (error) {
    console.error("获取记录错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
