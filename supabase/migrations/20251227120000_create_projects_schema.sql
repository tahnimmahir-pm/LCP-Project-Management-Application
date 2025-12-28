/*
  # Create Projects Module Schema

  1. New Tables
    - `projects`
      - Core project details including timeline and drive integration
      - Status tracking
    - `project_pillars` 
      - Defines weighted components of a project
    - `project_members`
      - Manages team assignment and roles

  2. Security (RLS)
    - Policies use JWT metadata to avoid recursion
    - Super Users/Managers have broad access
    - Leads/Members have project-specific access
*/

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'On Hold')),
  start_date date,
  end_date date,
  drive_folder_url text,
  lead_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- 2. PROJECT PILLARS TABLE
CREATE TABLE IF NOT EXISTS project_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  weight integer NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  created_at timestamptz DEFAULT now()
);

-- 3. PROJECT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Member' CHECK (role IN ('Lead', 'Member')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- 4. ENABLE RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES (Using JWT Metadata approach)

-- Helper to check if user is admin/manager from JWT
-- (This logic is embedded in policies for performance/safety)

-- PROJECTS POLICIES

-- View: Super Users and Managers see all. Members see their own.
CREATE POLICY "View Projects" ON projects
FOR SELECT USING (
  -- Admin/Manager Access
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
  OR 
  -- Lead Access
  lead_id = auth.uid()
  OR
  -- Member Access (via join table)
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = id AND pm.user_id = auth.uid()
  )
);

-- Create/Update: Super User, Manager, or Lead (for their own projects)
CREATE POLICY "Manage Projects" ON projects
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
  OR 
  lead_id = auth.uid()
);


-- PILLARS POLICIES

-- View: Same as projects
CREATE POLICY "View Pillars" ON project_pillars
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
      OR p.lead_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Manage: Admins, Managers, and Project Leads
CREATE POLICY "Manage Pillars" ON project_pillars
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
      OR p.lead_id = auth.uid()
    )
  )
);


-- MEMBERS POLICIES

-- View Members: Same as projects
CREATE POLICY "View Members" ON project_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
      OR p.lead_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Manage Members: Admins, Managers, and Project Leads
CREATE POLICY "Manage Members" ON project_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Super User', 'Manager')
      OR p.lead_id = auth.uid()
    )
  )
);
