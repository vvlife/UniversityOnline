import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export type LearningRecord = {
  id: string
  major: string
  courses: (string | { name: string; description: string })[] // 支持新旧两种格式
  votes: number
  created_at: string
  updated_at: string
  mindmap?: string
}

export type CourseCache = {
  id: string
  course_name: string
  major: string
  language: string
  mooc_courses: any[]
  textbooks: any[]
  created_at: string
  updated_at: string
}
