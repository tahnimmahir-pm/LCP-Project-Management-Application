/*
  # Fix Manager Accounts

  This migration recreates the manager and admin accounts that exist in auth.users
  but are missing from the users table, causing login failures.

  ## Changes
  - Retrieves auth user IDs for manager emails
  - Inserts manager records into users table with Active status
  - Ensures admins and managers can login without approval
*/

-- Insert manager accounts back into users table using their auth IDs
-- We need to handle this carefully since the auth users already exist

DO $$
DECLARE
  admin_id uuid;
  ops_id uuid;
  finance_id uuid;
  hr_id uuid;
  it_id uuid;
BEGIN
  -- Get the auth user IDs for each manager email
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@lightcastle.com';
  SELECT id INTO ops_id FROM auth.users WHERE email = 'ops.manager@lightcastle.com';
  SELECT id INTO finance_id FROM auth.users WHERE email = 'finance.manager@lightcastle.com';
  SELECT id INTO hr_id FROM auth.users WHERE email = 'hr.manager@lightcastle.com';
  SELECT id INTO it_id FROM auth.users WHERE email = 'it.manager@lightcastle.com';

  -- Insert admin if exists in auth
  IF admin_id IS NOT NULL THEN
    INSERT INTO users (id, email, password_hash, full_name, role, department, status)
    VALUES (admin_id, 'admin@lightcastle.com', 'managed_by_supabase', 'System Administrator', 'Super User', 'Administration', 'Active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      status = 'Active';
  END IF;

  -- Insert operations manager if exists in auth
  IF ops_id IS NOT NULL THEN
    INSERT INTO users (id, email, password_hash, full_name, role, department, status)
    VALUES (ops_id, 'ops.manager@lightcastle.com', 'managed_by_supabase', 'Operations Manager', 'Manager', 'Operations', 'Active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      status = 'Active';
  END IF;

  -- Insert finance manager if exists in auth
  IF finance_id IS NOT NULL THEN
    INSERT INTO users (id, email, password_hash, full_name, role, department, status)
    VALUES (finance_id, 'finance.manager@lightcastle.com', 'managed_by_supabase', 'Finance Manager', 'Manager', 'Finance', 'Active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      status = 'Active';
  END IF;

  -- Insert HR manager if exists in auth
  IF hr_id IS NOT NULL THEN
    INSERT INTO users (id, email, password_hash, full_name, role, department, status)
    VALUES (hr_id, 'hr.manager@lightcastle.com', 'managed_by_supabase', 'HR Manager', 'Manager', 'Human Resources', 'Active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      status = 'Active';
  END IF;

  -- Insert IT manager if exists in auth
  IF it_id IS NOT NULL THEN
    INSERT INTO users (id, email, password_hash, full_name, role, department, status)
    VALUES (it_id, 'it.manager@lightcastle.com', 'managed_by_supabase', 'IT Manager', 'Manager', 'Information Technology', 'Active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      status = 'Active';
  END IF;
END $$;