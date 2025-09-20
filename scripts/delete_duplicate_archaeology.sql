-- Delete the second archaeology record (keeping the first one)
DELETE FROM learning_records 
WHERE major LIKE '%考古学%' 
AND id NOT IN (
  SELECT id 
  FROM learning_records 
  WHERE major LIKE '%考古学%' 
  ORDER BY created_at ASC 
  LIMIT 1
);
