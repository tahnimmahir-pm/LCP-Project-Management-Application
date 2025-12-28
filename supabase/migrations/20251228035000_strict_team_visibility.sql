/*
  # Enforce Departmental Visibility (Line Manager Based)

  This update restricts user visibility based on the following rules:
  1. Super Users: Can view ALL users.
  2. Managers: 
     - Can view Super Users.
     - Can view Themselves.
     - Can view their DIRECT REPORTS (users who have this manager as line_manager_id).
     - CANNOT view other managers or employees of other departments.
  3. Employees (Regular):
     - Can view Super Users.
     - Can view their Line Manager.
     - Can view Colleagues (users who share the same line_manager_id).
     - CANNOT view users from other departments.
*/

-- 1. Drop existing permissive policy
DROP POLICY IF EXISTS "View Active Users" ON public.users;

-- 2. Create restricted policy
CREATE POLICY "View Department Users" ON public.users
FOR SELECT USING (
  status = 'Active' 
  AND (
    -- Rule 1: Viewer is Super User (Access All)
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Super User'
    
    OR
    
    -- Rule 2: Target is Super User (Visible to All)
    role = 'Super User'
    
    OR
    
    -- Rule 3: Target is Self (Visible to Self)
    id = auth.uid()
    
    OR
    
    -- Rule 4: Manager viewing Subordinate (Target's Manager is Viewer)
    line_manager_id = auth.uid()
    
    OR
    
    -- Rule 5: Subordinate viewing Manager (Target is Viewer's Manager)
    id = (
      SELECT line_manager_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
    
    OR
    
    -- Rule 6: Subordinate viewing Colleague (Target shares same Manager as Viewer)
    line_manager_id = (
      SELECT line_manager_id 
      FROM public.users 
      WHERE id = auth.uid()
    )
  )
);
