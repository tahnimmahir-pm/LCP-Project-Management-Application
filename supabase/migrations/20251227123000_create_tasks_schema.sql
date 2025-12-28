/*
  # Create Tasks Module Schema

  1. New Tables
    - `tasks`
      - Links to projects and pillars
      - Tracks status, priority, due date
  
  2. Security (RLS)
    - Leverages existing `is_project_member` function for robust access control
*/

CREATE TABLE IF NOT EXISTS tasks (
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

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- View Tasks: Super User, Manager, Lead, Member
CREATE POLICY "View Tasks" ON tasks FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager') OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid()) OR
  public.is_project_member(project_id, auth.uid())
);

-- Create Tasks: Super User, Manager, Lead, Member
CREATE POLICY "Create Tasks" ON tasks FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager') OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid()) OR
  public.is_project_member(project_id, auth.uid())
);

-- Update Tasks: Super User, Manager, Lead, Assignee
CREATE POLICY "Update Tasks" ON tasks FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager') OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid()) OR
  assignee_id = auth.uid() OR 
  public.is_project_member(project_id, auth.uid())
);
