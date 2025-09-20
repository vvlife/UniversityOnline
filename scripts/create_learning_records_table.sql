-- Create learning_records table to store search results
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  major VARCHAR(255) NOT NULL,
  courses JSONB NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_records_votes ON learning_records(votes DESC);
CREATE INDEX IF NOT EXISTS idx_learning_records_created_at ON learning_records(created_at DESC);
