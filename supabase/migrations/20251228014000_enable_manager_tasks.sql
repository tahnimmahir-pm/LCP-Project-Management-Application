/*
  # Allow Managers to Create Tasks in Super User Projects
  
  1. Update "Create Tasks" policy: Allow 'Manager' role to insert tasks generally.
     (Filter logic is handled in UI to restrict to owned + SU projects).
  
  2. Update "View Tasks" policy: Add check for `created_by = auth.uid()`.
     This ensures that if a Manager creates a task in a project they don't lead,
     they can still see it.
*/

-- 1. Create permissions
DROP POLICY IF EXISTS "Create Tasks" ON project_tasks;

CREATE POLICY "Create Tasks" ON project_tasks
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
  OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
);

-- 2. View permissions (Add created_by check)
DROP POLICY IF EXISTS "View Tasks" ON project_tasks;

CREATE POLICY "View Tasks" ON project_tasks
FOR SELECT USING (
  -- Super User
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR
  -- Project Lead
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
  OR
  -- Assignee
  assignee_id = auth.uid()
  OR
  -- Creator (NEW)
  created_by = auth.uid()
);

-- 3. Update permissions (Add created_by check)
DROP POLICY IF EXISTS "Update Tasks" ON project_tasks;

CREATE POLICY "Update Tasks" ON project_tasks
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
  OR
  assignee_id = auth.uid()
  OR
  created_by = auth.uid()
);
