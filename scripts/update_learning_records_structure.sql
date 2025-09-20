-- 更新learning_records表结构，将courses字段改为包含课程描述的JSON格式
ALTER TABLE learning_records 
ALTER COLUMN courses TYPE jsonb USING courses::jsonb;

-- 添加注释说明新的数据结构
COMMENT ON COLUMN learning_records.courses IS 'JSON array of course objects with name and description: [{"name": "课程名", "description": "课程描述"}]';
