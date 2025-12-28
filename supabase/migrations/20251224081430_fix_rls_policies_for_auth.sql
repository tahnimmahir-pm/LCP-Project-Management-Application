/*
  # Fix RLS Policies for Authentication

  The current RLS policies are blocking authenticated managers and admins from
  reading their own data during login. This migration simplifies the policies
  to allow authenticated users to always read their own user record.

  ## Changes
  - Drop and recreate the "Users can view own data" policy with correct permissions
  - Ensure managers and admins can login without RLS blocking them
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Recreate with explicit permissions for authenticated role
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);