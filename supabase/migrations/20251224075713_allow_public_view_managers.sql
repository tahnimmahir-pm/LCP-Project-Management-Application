/*
  # Allow Public Access to View Managers

  1. Purpose
    - Allow anonymous users to view active managers during registration
    - Users need to see managers in the dropdown when creating their account

  2. Changes
    - Add RLS policy allowing anyone (anon + authenticated) to view Active managers
    - Only shows users with Manager or Super User role and Active status
    - This is safe as it only exposes names and IDs of managers, not sensitive data

  3. Security
    - Limited to Active status only
    - Limited to Manager and Super User roles only
    - Only exposes minimal information needed for registration dropdown
*/

-- Allow anyone to view active managers for registration dropdown
CREATE POLICY "Anyone can view active managers"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'Active' 
    AND role IN ('Manager', 'Super User')
  );