# LightCastle Partners Project Management System

## Phase 1: Authentication & User Approval - COMPLETED ✅

### What's Been Implemented

#### 1. Database Schema
- Created `users` table with all required fields
- Implemented Row Level Security (RLS) policies
- Added proper indexes for performance
- Email validation and unique constraints

#### 2. Authentication System
- User registration with validation
- Email/password login
- Session management
- Account status checking (Pending, Active, Rejected, Inactive)
- Password strength indicator
- Remember me functionality

#### 3. User Approval Workflow
- Manager and Super User approval dashboard
- Pending user list with full details
- Approve/Reject functionality
- Role-based access control
- Line manager assignment during registration

#### 4. UI Components
- Clean, modern design with LightCastle branding
- Lato font family
- Primary color: #061b39
- Responsive layout
- Loading states and error handling

### Getting Started

#### Pre-configured Manager Accounts

The system now comes with pre-configured manager accounts that you can use immediately:

**Super User Account:**
- Email: `admin@lightcastle.com`
- Password: `Admin@123`
- Role: Super User
- Can approve all users and has full system access

**Department Managers:**

1. **Operations Manager**
   - Email: `ops.manager@lightcastle.com`
   - Password: `Manager@123`
   - Department: Operations

2. **Finance Manager**
   - Email: `finance.manager@lightcastle.com`
   - Password: `Manager@123`
   - Department: Finance

3. **HR Manager**
   - Email: `hr.manager@lightcastle.com`
   - Password: `Manager@123`
   - Department: Human Resources

4. **IT Manager**
   - Email: `it.manager@lightcastle.com`
   - Password: `Manager@123`
   - Department: Information Technology

**Note:** These managers will appear in the "Line Manager" dropdown during registration.

---

#### Manual Super User Setup (Alternative Method)

If you need to create additional managers manually:

1. Go to your Supabase Dashboard
2. Navigate to: SQL Editor
3. Run this command to create a Super User:

```sql
-- First, create an auth user (you'll use this email/password to login)
-- Note: Replace with your desired email and password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@lightcastle.com', -- Change this email
  crypt('YourPassword123!', gen_salt('bf')), -- Change this password
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- Copy the ID from above and use it in the next query
-- Or run this complete query after replacing the email:
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@lightcastle.com'
)
INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  department,
  status
)
SELECT
  id,
  'admin@lightcastle.com',
  'managed_by_supabase',
  'System Administrator',
  'Super User',
  'Administration',
  'Active'
FROM auth_user;
```

OR use the simpler approach - create a Manager first:

```sql
-- Create a Manager account that can approve others
WITH auth_user AS (
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'manager@lightcastle.com',
    crypt('Manager123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}', now(), now()
  ) RETURNING id, email
)
INSERT INTO public.users (
  id, email, password_hash, full_name, role, department, status
)
SELECT
  id, email, 'managed_by_supabase',
  'First Manager', 'Manager', 'Operations', 'Active'
FROM auth_user;
```

### User Flow

1. **New User Registration**
   - Fill out registration form
   - Select line manager
   - Submit (status = Pending)
   - Wait for approval

2. **Manager/Super User Approval**
   - Login to dashboard
   - See pending approvals
   - Review user details
   - Approve or Reject

3. **Approved User Login**
   - Login with email/password
   - Access dashboard
   - See role-appropriate features

### Features by Role

#### Regular User
- View own profile
- Submit tasks (coming soon)
- Submit expense claims (coming soon)

#### Project Lead
- Everything Regular User can do
- Create and manage projects (coming soon)
- Assign tasks (coming soon)

#### Manager
- Everything Project Lead can do
- Approve user registrations
- View team members
- Approve expense claims (coming soon)

#### Finance
- View and process finance claims (coming soon)

#### Super User
- Full system access
- Approve all users
- Manage all projects
- Final approval authority

### Next Steps

#### Phase 2: Project Management (Priority)
- Project creation with pillars
- Project dashboard
- Team assignment
- Project editing and deletion approval
- Google Drive integration

#### Phase 3: Task Management (Priority)
- Task creation and assignment
- Task status tracking
- Task lists and filters
- File attachments
- Google Calendar integration

### Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

### Security Features

- Password strength validation
- Email uniqueness checking
- Row Level Security (RLS)
- Role-based access control
- Session management
- Failed login tracking (handled by Supabase)

### Notes

- All passwords are hashed by Supabase
- Sessions expire after 8 hours of inactivity
- Remember Me extends session to 7 days
- Email validation enforced at database level
