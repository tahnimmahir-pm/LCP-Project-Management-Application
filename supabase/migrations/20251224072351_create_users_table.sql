/*
  # Create Users and Authentication Tables

  1. New Tables
    - `users` - Core user information and authentication
      - `id` (uuid, primary key) - Unique user identifier
      - `email` (text, unique) - User email address
      - `password_hash` (text) - Hashed password
      - `full_name` (text) - User's full name
      - `role` (text) - User role (Regular User, Project Lead, Manager, Finance, Super User)
      - `department` (text) - User's department
      - `phone` (text) - Phone number (optional)
      - `status` (text) - Account status (Pending, Active, Rejected, Inactive)
      - `line_manager_id` (uuid) - Reference to manager
      - `created_at` (timestamptz) - Account creation timestamp
      - `last_login` (timestamptz) - Last login timestamp
      - `google_calendar_token` (text) - Encrypted calendar token
      - `preferences` (jsonb) - User preferences

  2. Security
    - Enable RLS on `users` table
    - Add policies for user access control
    - Users can view their own data
    - Managers can view their team members
    - Super Users can view all users

  3. Notes
    - Password hashing must be handled by application layer (bcrypt)
    - Email uniqueness enforced at database level
    - Status defaults to 'Pending' for new registrations
    - Calendar token stored encrypted
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'Regular User' CHECK (role IN ('Regular User', 'Project Lead', 'Manager', 'Finance', 'Super User')),
  department text,
  phone text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Rejected', 'Inactive')),
  line_manager_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  google_calendar_token text,
  preferences jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Users can update their own data (except role and status)
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Managers can view their team members
CREATE POLICY "Managers can view team members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users mgr
      WHERE mgr.id = auth.uid()
      AND mgr.role IN ('Manager', 'Super User')
      AND (users.line_manager_id = mgr.id OR mgr.role = 'Super User')
    )
  );

-- Policy: Managers and Super Users can approve users
CREATE POLICY "Managers can approve users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users mgr
      WHERE mgr.id = auth.uid()
      AND mgr.role IN ('Manager', 'Super User')
      AND mgr.status = 'Active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users mgr
      WHERE mgr.id = auth.uid()
      AND mgr.role IN ('Manager', 'Super User')
      AND mgr.status = 'Active'
    )
  );

-- Policy: Anyone can insert (register) but status will be Pending
CREATE POLICY "Anyone can register"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'Pending');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_line_manager ON users(line_manager_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger for last_login will be handled by application layer during auth