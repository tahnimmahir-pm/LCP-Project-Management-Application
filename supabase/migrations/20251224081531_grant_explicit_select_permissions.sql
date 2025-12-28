/*
  # Grant Explicit Table Permissions

  Ensuring the authenticated role has proper table-level grants
  before RLS policies are evaluated.

  ## Changes
  - Explicitly grant SELECT, INSERT, UPDATE permissions to authenticated role
  - Verify RLS is enabled
  - Recreate policies with proper configuration
*/

-- Ensure authenticated role has table-level permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can register" ON users;
DROP POLICY IF EXISTS "Anyone can view active managers" ON users;
DROP POLICY IF EXISTS "Managers can view pending team members" ON users;
DROP POLICY IF EXISTS "Managers can update user status" ON users;

-- Policy 1: Users can view their own data (CRITICAL for login)
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Anyone can view active managers (for registration dropdown)
CREATE POLICY "Anyone can view active managers"
  ON users
  FOR SELECT
  USING (status = 'Active' AND role IN ('Manager', 'Super User'));

-- Policy 3: Managers can view pending users they manage
CREATE POLICY "Managers can view pending team members"
  ON users
  FOR SELECT
  USING (
    status IN ('Pending', 'Rejected') 
    AND (
      line_manager_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'Super User' 
        AND u.status = 'Active'
      )
    )
  );

-- Policy 4: Anyone can register (insert with Pending status)
CREATE POLICY "Anyone can register"
  ON users
  FOR INSERT
  WITH CHECK (status = 'Pending');

-- Policy 5: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 6: Managers can update user status
CREATE POLICY "Managers can update user status"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('Manager', 'Super User')
      AND u.status = 'Active'
    )
  );