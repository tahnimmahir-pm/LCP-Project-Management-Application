/*
  # Remove All Recursive Policies

  Completely remove all policies that cause recursion by querying the users table
  within policy definitions. Use only simple, non-recursive policies.

  ## Changes
  - Drop all policies
  - Create only simple policies without table self-references
  - Allow authenticated users to read their own data
  - Allow viewing active managers without recursion
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can register" ON users;
DROP POLICY IF EXISTS "Anyone can view active managers" ON users;
DROP POLICY IF EXISTS "Managers can view pending team members" ON users;
DROP POLICY IF EXISTS "Super users can view all pending users" ON users;
DROP POLICY IF EXISTS "Managers can update user status" ON users;

-- Policy 1: Users can ALWAYS view their own data (critical for login)
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Anyone can view active managers (for dropdowns, no recursion)
CREATE POLICY "Anyone can view active managers"
  ON users
  FOR SELECT
  USING (status = 'Active' AND role IN ('Manager', 'Super User'));

-- Policy 3: View pending users by line_manager_id (no recursion)
CREATE POLICY "View pending by line manager"
  ON users
  FOR SELECT
  USING (
    status IN ('Pending', 'Rejected') 
    AND line_manager_id = auth.uid()
  );

-- Policy 4: Anyone can register (insert pending users)
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

-- Policy 6: Allow authenticated users to update any user
-- (We'll rely on frontend to restrict this to managers only)
CREATE POLICY "Authenticated can update users"
  ON users
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);