-- Create course cache table for persistent storage
CREATE TABLE IF NOT EXISTS public.course_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  major TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh',
  mooc_courses JSONB NOT NULL,
  textbooks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Create unique constraint to prevent duplicates
  UNIQUE(course_name, major, language)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_cache_lookup ON course_cache(course_name, major, language);
CREATE INDEX IF NOT EXISTS idx_course_cache_created_at ON course_cache(created_at);

-- Enable RLS (though this is public data, we still follow best practices)
ALTER TABLE course_cache ENABLE ROW LEVEL SECURITY;

-- Allow all users to read cache data
CREATE POLICY "Allow all users to read course cache" ON course_cache FOR SELECT USING (true);

-- Allow all users to insert/update cache data (since this is public educational content)
CREATE POLICY "Allow all users to insert course cache" ON course_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update course cache" ON course_cache FOR UPDATE USING (true);
