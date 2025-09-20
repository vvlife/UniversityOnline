-- 创建学习记录表的改进版本
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  major TEXT NOT NULL,
  courses TEXT NOT NULL, -- JSON string of course names
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_learning_records_major ON learning_records(major);
CREATE INDEX IF NOT EXISTS idx_learning_records_votes ON learning_records(votes DESC);
CREATE INDEX IF NOT EXISTS idx_learning_records_created_at ON learning_records(created_at DESC);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_learning_records_updated_at 
    BEFORE UPDATE ON learning_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
