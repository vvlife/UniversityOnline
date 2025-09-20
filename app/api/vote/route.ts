import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { recordId } = await request.json()

    if (!recordId) {
      return NextResponse.json({ error: "记录ID是必需的" }, { status: 400 })
    }

    const supabase = createServerClient()

    // First get the current vote count
    const { data: currentRecord, error: fetchError } = await supabase
      .from("learning_records")
      .select("votes")
      .eq("id", recordId)
      .single()

    if (fetchError) {
      console.error("获取当前投票数失败:", fetchError)
      return NextResponse.json({ error: "获取记录失败" }, { status: 500 })
    }

    // Increment vote count
    const newVotes = (currentRecord.votes || 0) + 1

    const { data, error } = await supabase
      .from("learning_records")
      .update({
        votes: newVotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId)
      .select("votes")
      .single()

    if (error) {
      console.error("投票失败:", error)
      return NextResponse.json({ error: "投票失败" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      votes: data.votes,
    })
  } catch (error) {
    console.error("投票错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
