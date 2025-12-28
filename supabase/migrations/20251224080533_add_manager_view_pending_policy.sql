/*
  # Allow Managers to View Pending Users

  1. Purpose
    - Managers need to see pending user registrations to approve them
    - Super Users need to see all pending users
    - Regular managers only see users who selected them as line manager

  2. Security
    - Only shows users with Pending or Rejected status
    - Managers see only their team members (line_manager_id matches)
    - Super Users see all pending users
    - Uses direct auth.uid() check to avoid infinite recursion

  3. Changes
    - Add SELECT policy for managers to view pending team members
    - Uses simple condition without subquery on users table
*/

-- Allow managers to view pending users assigned to them
CREATE POLICY "Managers can view pending team members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    status IN ('Pending', 'Rejected')
    AND (
      line_manager_id = auth.uid()  -- Direct check without subquery
      OR EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND au.raw_user_meta_data->>'role' = 'Super User'
      )
    )
  );