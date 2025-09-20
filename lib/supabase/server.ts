import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Create a Supabase server client following best practices
 * Don't put this client in a global variable. Always create a new client within each function.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

export { createServerClient } from "@supabase/ssr"

export const supabaseServer = createClient

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
