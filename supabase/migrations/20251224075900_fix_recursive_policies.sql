/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - Policies with subqueries on the same table cause infinite recursion
    - "Managers can view team members" and "Managers can approve users" policies
      query the users table while defining policies on the users table

  2. Solution
    - Drop the recursive policies
    - Replace with simpler, non-recursive policies
    - Use auth metadata or direct checks instead of subqueries

  3. New Policies
    - Keep simple policies that don't cause recursion
    - Managers will be able to view team members in application logic
*/

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Managers can view team members" ON users;
DROP POLICY IF EXISTS "Managers can approve users" ON users;

-- Add a simple policy for managers to update user status (for approvals)
-- This uses direct role check without subquery
CREATE POLICY "Managers can update user status"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' IN ('Manager', 'Super User')
    )
  );