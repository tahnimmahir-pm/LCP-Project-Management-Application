/*
  # Consolidation Migration: Metadata Sync & Stricter RLS
  
  1. Metadata Sync (Fixes "Manager sees nothing")
     - Creates a trigger to copy `role` and `status` from public.users to auth.users metadata.
     - Runs a backfill for existing users.
  
  2. Project RLS Updates (User Request)
     - READ: All authenticated users can view all projects (Transparency).
     - WRITE: Only Super Users or Project Leads can Edit/Delete.
  
  3. Task RLS Updates (User Request)
     - Super Users: View ALL.
     - Project Leads: View ALL tasks in their projects.
     - Others (Managers/Members): View ONLY tasks assigned to them.
*/

-- ==========================================
-- 1. METADATA SYNC (Fixing the root Auth issue)
-- ==========================================

-- Function to sync public user data to JWT metadata
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'status', NEW.status,
      'full_name', NEW.full_name
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on every user update/insert
DROP TRIGGER IF EXISTS on_user_update ON public.users;
CREATE TRIGGER on_user_update
AFTER UPDATE OR INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Backfill: Force update all users to trigger the sync
UPDATE public.users SET updated_at = now();


-- ==========================================
-- 2. PROJECT PERMISSIONS (Transparency + Control)
-- ==========================================

-- Drop existing generic policies to replace with specific ones
DROP POLICY IF EXISTS "View Projects" ON projects;
DROP POLICY IF EXISTS "Manage Projects" ON projects;

-- NEW READ Policy: "Transparnecy" - Everyone can see projects
CREATE POLICY "View Projects" ON projects
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- NEW WRITE Policy: "Control" - Only Super User or Lead
CREATE POLICY "Manage Projects" ON projects
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR 
  lead_id = auth.uid()
);


-- ==========================================
-- 3. TASK PERMISSIONS (Strict Privacy)
-- ==========================================

DROP POLICY IF EXISTS "View Tasks" ON tasks;
DROP POLICY IF EXISTS "Create Tasks" ON tasks;
DROP POLICY IF EXISTS "Update Tasks" ON tasks;

-- VIEW: Super User (All), Lead (Project Tasks), Assignee (My Tasks)
CREATE POLICY "View Tasks" ON tasks
FOR SELECT USING (
  -- 1. Super User sees all
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR
  -- 2. I am the Project Lead (I need to oversee my project)
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
  OR
  -- 3. The task is assigned to me
  assignee_id = auth.uid()
  -- (Removed generic "Manager" check -> Strict Privacy)
);

-- MANAGE: Super User OR Project Lead
-- (Regular users/Managers usually shouldn't create tasks in other people's projects unless assigned?)
-- Let's allow Assignees to Update their own task status, but not delete.
CREATE POLICY "Create Tasks" ON tasks
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
);

CREATE POLICY "Update Tasks" ON tasks
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
  OR
  assignee_id = auth.uid()
);

-- DELETE: Only Super User or Lead
CREATE POLICY "Delete Tasks" ON tasks
FOR DELETE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
  OR 
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.lead_id = auth.uid())
);
