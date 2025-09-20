-- 创建学习记录表的最新版本
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  major TEXT NOT NULL,
  courses JSONB NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_learning_records_votes ON learning_records(votes DESC);
CREATE INDEX IF NOT EXISTS idx_learning_records_created_at ON learning_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_records_major ON learning_records(major);

-- 启用行级安全策略（如果需要）
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（适用于公开应用）
CREATE POLICY IF NOT EXISTS "Allow all operations on learning_records" ON learning_records
FOR ALL USING (true) WITH CHECK (true);
