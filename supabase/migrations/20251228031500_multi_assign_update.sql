/*
  # Multi-Assignee & Line Manager Constraints
  
  1. Schema: Add `assignee_ids` array to `project_tasks`.
  2. Data Migration: Copy existing `assignee_id` to new array.
  3. RLS: Update policies to check `assignee_ids` for visibility.
*/

-- 1. Add column
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS assignee_ids uuid[] DEFAULT '{}';

-- 2. Migrate data (Safely)
UPDATE project_tasks 
SET assignee_ids = array_append('{}', assignee_id) 
WHERE assignee_id IS NOT NULL AND (assignee_ids IS NULL OR assignee_ids = '{}');

-- 3. Update RLS for Visibility (View Tasks)
DROP POLICY IF EXISTS "View Tasks" ON project_tasks;

CREATE POLICY "View Tasks" ON project_tasks
FOR SELECT USING (
  -- Super User
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR
  -- Project Lead
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
  OR
  -- Assigned (Single - Legacy)
  assignee_id = auth.uid()
  OR
  -- Assigned (Multi - New)
  auth.uid() = ANY(assignee_ids)
  OR
  -- Creator (Assigned By Me)
  created_by = auth.uid()
);

-- 4. Update RLS for Edit/Update
DROP POLICY IF EXISTS "Update Tasks" ON project_tasks;

CREATE POLICY "Update Tasks" ON project_tasks
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
  OR
  assignee_id = auth.uid()
  OR
  auth.uid() = ANY(assignee_ids)
  OR
  created_by = auth.uid()
);
