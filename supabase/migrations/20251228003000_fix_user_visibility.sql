/*
  # Fix User Visibility for Task Assignment
  
  Problem: Previous RLS policies only allowed viewing 'Managers' and 'Super Users'. 
  Regular Users were invisible, so Managers could not assign tasks to them.
  
  Solution: Allow all authenticated users to view 'Active' users. 
  This supports the Team Directory and Task Assignment dropdowns.
*/

-- Drop restrictive policies
DROP POLICY IF EXISTS "Anyone can view active managers" ON users;
DROP POLICY IF EXISTS "View Active Users" ON users;

-- Create permissive 'Directory' policy
CREATE POLICY "View Active Users" ON public.users
FOR SELECT USING (
  status = 'Active' 
  AND 
  auth.role() = 'authenticated'
);
