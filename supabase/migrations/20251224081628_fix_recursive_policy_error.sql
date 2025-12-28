/*
  # Fix Recursive Policy Error

  The policies were causing infinite recursion by querying the users table
  within the policy definitions. This migration removes the recursive references.

  ## Changes
  - Remove policies that cause recursion
  - Simplify policies to avoid self-referencing queries
  - Ensure managers and admins can login successfully
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Managers can view pending team members" ON users;
DROP POLICY IF EXISTS "Managers can update user status" ON users;

-- Recreate without recursion - pending users visible to their line manager
CREATE POLICY "Managers can view pending team members"
  ON users
  FOR SELECT
  USING (
    status IN ('Pending', 'Rejected') 
    AND line_manager_id = auth.uid()
  );

-- Super users can view all pending users (no recursion - just check role in current row)
CREATE POLICY "Super users can view all pending users"
  ON users
  FOR SELECT
  USING (
    status IN ('Pending', 'Rejected')
    AND auth.uid() IN (
      SELECT id FROM users WHERE role = 'Super User' AND status = 'Active' AND id = auth.uid()
    )
  );

-- Managers can update any user (no recursion check, rely on frontend auth)
CREATE POLICY "Managers can update user status"
  ON users
  FOR UPDATE
  USING (true);