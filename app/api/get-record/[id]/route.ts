import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("正在查询记录ID:", params.id)

    const supabase = createServerClient()

    let retries = 3
    let record = null
    let error = null

    while (retries > 0) {
      try {
        const result = await Promise.race([
          supabase.from("learning_records").select("*").eq("id", params.id).single(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("请求超时")), 10000)),
        ])

        record = result.data
        error = result.error
        break
      } catch (timeoutError) {
        console.log(`请求超时，剩余重试次数: ${retries - 1}`)
        retries--
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } else {
          error = timeoutError
        }
      }
    }

    console.log("查询结果:", { record, error })

    if (error) {
      console.error("Supabase查询错误:", error)
      if (error.message === "请求超时") {
        return NextResponse.json(
          {
            success: false,
            error: "网络连接超时，请稍后重试",
          },
          { status: 408 },
        )
      }
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "学习路径不存在",
          },
          { status: 404 },
        )
      }
      return NextResponse.json(
        {
          success: false,
          error: "网络连接失败，请稍后重试",
        },
        { status: 500 },
      )
    }

    if (!record) {
      console.log("未找到记录")
      return NextResponse.json(
        {
          success: false,
          error: "学习路径不存在",
        },
        { status: 404 },
      )
    }

    console.log("成功获取记录:", record.major)
    return NextResponse.json({
      success: true,
      record,
    })
  } catch (error) {
    console.error("API路由错误:", error)
    return NextResponse.json(
      {
        success: false,
        error: "网络连接失败，请稍后重试",
      },
      { status: 500 },
    )
  }
}
