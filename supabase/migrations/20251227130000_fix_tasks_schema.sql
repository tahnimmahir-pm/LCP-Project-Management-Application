/*
  # Rename tasks to project_tasks
  
  This migration renames the tables to fixing persistent schema caching issues.
  
  1. Drop old `tasks` table
  2. Create `project_tasks` table (Identical structure)
  3. Re-apply RLS policies
*/

-- 1. Clean up old table
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;

-- 2. Create New Table
CREATE TABLE project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  pillar_id uuid REFERENCES project_pillars(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'In Review', 'Done')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date timestamptz,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Updated for project_tasks)

-- View Tasks
CREATE POLICY "View Tasks" ON project_tasks FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager') OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid()) OR
  public.is_project_member(project_id, auth.uid())
);

-- Create Tasks
CREATE POLICY "Create Tasks" ON project_tasks FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager') OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid()) OR
  public.is_project_member(project_id, auth.uid())
);

-- Update Tasks
CREATE POLICY "Update Tasks" ON project_tasks FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager') OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid()) OR
  assignee_id = auth.uid() OR
  public.is_project_member(project_id, auth.uid())
);

-- 5. Notify
NOTIFY pgrst, 'reload config';
