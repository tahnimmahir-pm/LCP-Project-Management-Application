# LightCastle Partners - Project Management Platform

<div align="center">

![Admin Dashboard](images/01%20admin%20deshboard.png)

**A comprehensive project management platform built for LightCastle Partners to streamline project tracking, task management, team collaboration, and expense claim workflows.**

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://your-demo-url.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e.svg)](https://supabase.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [User Roles & Permissions](#-user-roles--permissions)
- [Finance Approval Workflow](#-finance-approval-workflow)
- [Screenshots](#-screenshots)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

LightCastle Partners Dashboard is a central hub designed for modern teams to collaborate effectively while maintaining data security and structured approval workflows. The platform ensures that sensitive information (like financial claims) follows strict approval processes while keeping everyday project and task management simple and intuitive.

**Key Benefits:**
- 🔒 **Role-based security** - Everyone sees exactly what they need to see
- 📊 **Real-time collaboration** - Instant updates across the team
- 💰 **Automated approvals** - Multi-level workflow for expense claims
- 📈 **Performance tracking** - Team efficiency metrics and project progress
- 🎨 **Intuitive interface** - Clean, modern design built with React & Tailwind

---

## ✨ Features

### 🔐 User Management
- Secure authentication with Supabase Auth
- Manager-approved registration workflow
- Role-based access control (RBAC)
- Team hierarchy with line manager relationships

### 📁 Project Management
- Create and track projects with custom statuses
- Progress visualization with completion bars
- Google Drive folder integration
- Strategic pillar alignment (Growth, Sustainability, etc.)
- Team member assignments

### ✅ Task Tracking
- Comprehensive task management system
- Priority levels (Low, Medium, High)
- Status tracking (Todo, In Progress, In Review, Done)
- Due date management with overdue alerts
- Filter by assignee, status, and priority
- Toggle between "My Tasks" and "Tasks I Assigned"

### 👥 Team Directory
- View all active team members
- Department and role information
- Contact details and reporting structure
- Search and filter capabilities

### 💰 Expense Claims
- Multi-level approval workflow
- Receipt attachment support (Image/PDF)
- Category-based expense tracking
- Real-time status updates
- Approval/rejection with comments

### 📊 Dashboard & Analytics
- Active project overview
- Team efficiency metrics
- Pending approvals widget
- Task assignment widgets
- Strategic pillar distribution

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI framework with type safety |
| **Build Tool** | Vite | Lightning-fast dev server & builds |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Icons** | Lucide React | Beautiful, consistent icons |
| **Backend** | Supabase | PostgreSQL + Auth + Real-time |
| **Deployment** | Vercel | Serverless deployment platform |

**Why This Stack?**
- ⚡ **Performance** - Vite provides instant HMR and optimized builds
- 🔒 **Type Safety** - TypeScript catches bugs before runtime
- 🎨 **Design System** - Tailwind enables rapid, consistent UI development
- 🚀 **Scalability** - Supabase handles auth, database, and real-time out of the box

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account ([Create one free](https://supabase.com))
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/lcp-project-management.git
cd lcp-project-management
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 💡 **Tip:** Get these values from your [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API

4. **Run database migrations**

Execute the SQL schema from `database/schema.sql` in your Supabase SQL Editor

5. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running!

6. **Build for production**

```bash
npm run build
npm run preview  # Preview the production build locally
```

---

## 👥 User Roles & Permissions

The system implements a hierarchical role-based access control system where everyone sees exactly what they need to see.

### Role Hierarchy

```
┌─────────────────┐
│   Super User    │  Full system access, override approvals
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Manager │ │Finance │ │Proj Lead │
└───┬────┘ └────────┘ └────┬─────┘
    │                       │
    ▼                       ▼
┌─────────────────────────────┐
│      Regular Users          │
└─────────────────────────────┘
```

### Detailed Permissions

| Role | Dashboard Access | Task Management | Expense Approvals | User Management |
|------|-----------------|-----------------|-------------------|-----------------|
| **Super User** | All modules | View/edit all tasks | Override any approval | Manage all users |
| **Finance Manager** | Finance + Approvals | Own tasks only | Final approval stage | View team |
| **Line Manager** | Team overview | Team tasks + assignments | First approval stage | Approve registrations |
| **Project Lead** | Project-specific | Assign tasks in projects | View only | View project team |
| **Regular User** | Personal dashboard | Own tasks only | Submit claims only | View directory |

### 🔒 Privacy & Security

- **Task Privacy**: Users only see tasks assigned to them or created by them
- **Financial Privacy**: Expense claims are visible only to the submitter and approvers in the chain
- **Data Isolation**: Managers see only their direct reports' information
- **Audit Trail**: All approvals and rejections are logged with timestamps

---

## 💰 Finance Approval Workflow

The expense claims module follows a strict **3-step approval process** to ensure financial controls:

### Workflow Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌───────────┐
│  Employee    │────▶│ PENDING_MANAGER  │────▶│ PENDING_FINANCE  │────▶│ APPROVED  │
│  Submits     │     │ (Line Manager)   │     │ (Finance Team)   │     │           │
└──────────────┘     └────────┬─────────┘     └────────┬─────────┘     └───────────┘
                              │                         │
                              │ Reject                  │ Reject
                              ▼                         ▼
                        ┌──────────────────────────────────┐
                        │         REJECTED                 │
                        │  (Reason recorded + notified)    │
                        └──────────────────────────────────┘
```

### Step-by-Step Process

#### 1️⃣ Employee Submits a Claim

**Actions:**
- Navigate to **Finance** tab → Click **"New Claim"**
- Fill in required details:
  - Title (e.g., "Client Meeting Lunch")
  - Amount (numeric value)
  - Category (Travel, Meals, Supplies, etc.)
  - Description (optional context)
  - Project (link to specific project)
- Attach receipt (Image or PDF, optional but recommended)

**Result:** Status becomes `PENDING_MANAGER`

**What Happens Next:**
- Claim appears in Line Manager's "Approvals" tab
- Email notification sent to Line Manager
- Employee can track status in Finance module

---

#### 2️⃣ Line Manager Approval

**Actions:**
- Line Manager logs in
- System shows pending claims in **Approvals** tab
- Review claim details and attached receipt
- Choose action:
  - ✅ **Approve** → Status becomes `PENDING_FINANCE`
  - ❌ **Reject** → Status becomes `REJECTED` (must provide reason)

**Visibility Rules:**
- Finance team **cannot** see claims at this stage
- Only assigned Line Manager has access
- Super Users can view all claims

---

#### 3️⃣ Finance Department Approval

**Actions:**
- Finance Manager logs in
- Approved claims appear in their **Approvals** tab
- Final review for reimbursement processing
- Choose action:
  - ✅ **Approve** → Status becomes `APPROVED`
  - ❌ **Reject** → Status becomes `REJECTED` (must provide reason)

**Result:** 
- Employee receives notification of final decision
- If approved, claim enters reimbursement queue
- All decisions are logged in the database

---

### Claim Statuses Explained

| Status | Meaning | Visible To | Next Action |
|--------|---------|------------|-------------|
| `DRAFT` | Being prepared | Employee only | Submit claim |
| `PENDING_MANAGER` | Awaiting manager review | Employee + Manager | Manager approval |
| `PENDING_FINANCE` | Awaiting finance review | Employee + Manager + Finance | Finance approval |
| `APPROVED` | Fully approved | All approvers + Employee | Process reimbursement |
| `REJECTED` | Denied at any stage | All approvers + Employee | None (can resubmit) |

---

## 📸 Screenshots

### 🔑 Login Page
Secure authentication portal for team members.

![Login Page](images/06%20login.png)

---

### 👤 New Employee Registration
New team members register and select their line manager for approval workflow.

![Employee Registration](images/07%20new_employee_registration.png)

---

### 🏠 Admin Dashboard
Main dashboard with pending approvals, task widgets, and quick navigation.

**Features:**
- Pending user approvals for managers
- "Tasks Assigned to Me" widget
- "Tasks Assigned by Me" widget (for managers)
- Active project count
- Team efficiency score

![Admin Dashboard](images/01%20admin%20deshboard.png)

---

### 📁 Projects Module
Create and manage projects with progress tracking and team assignments.

**Features:**
- Project status visualization
- Progress bars based on task completion
- Google Drive folder integration
- Edit/delete for Project Leads and Super Users
- Strategic pillar assignment

![Projects](images/02%20project.png)

---

### ✅ Tasks Module
Comprehensive task management with advanced filtering.

**Features:**
- Filter by status, priority, and assignee
- Toggle between "All Tasks", "Assigned to Me", "Assigned by Me"
- Color-coded priority indicators
- Due date tracking with overdue alerts
- Inline status updates

![Tasks](images/03%20task.png)

---

### 👥 Team Directory
View all active team members with roles and contact information.

**Features:**
- Department filtering
- Search by name
- Role and manager information
- Email and phone display

![Team Directory](images/04%20team.png)

---

### 💰 Finance Module
Submit and track expense claims with multi-level approval system.

**Features:**
- View your submitted claims
- See pending approvals (for Managers/Finance)
- Status tracking with color coding
- Receipt attachment preview
- Approval/rejection with comments

![Finance](images/05%20finance.png)

---

## 📊 Database Schema

The application uses a PostgreSQL database (via Supabase) with 6 main tables:

### Core Tables

```sql
users
├── id (uuid, PK)
├── email (text, unique)
├── full_name (text)
├── role (enum: super_user, manager, project_lead, finance, regular_user)
├── department (text)
├── line_manager_id (uuid, FK → users.id)
├── status (enum: pending, active, rejected)
└── created_at (timestamp)

projects
├── id (uuid, PK)
├── project_name (text)
├── project_lead_id (uuid, FK → users.id)
├── status (text)
├── start_date (date)
├── end_date (date)
├── drive_folder_url (text)
└── created_at (timestamp)

project_tasks
├── id (uuid, PK)
├── project_id (uuid, FK → projects.id)
├── task_name (text)
├── assigned_to (uuid, FK → users.id)
├── created_by (uuid, FK → users.id)
├── priority (enum: low, medium, high)
├── status (enum: todo, in_progress, in_review, done)
├── due_date (date)
└── created_at (timestamp)

expense_claims
├── id (uuid, PK)
├── user_id (uuid, FK → users.id)
├── project_id (uuid, FK → projects.id)
├── amount (numeric)
├── category (text)
├── status (enum: draft, pending_manager, pending_finance, approved, rejected)
├── receipt_url (text)
├── manager_approved_at (timestamp)
├── finance_approved_at (timestamp)
└── created_at (timestamp)
```

### Relationship Diagram

```
users ──┐
        ├──< project_tasks (assigned_to)
        ├──< project_tasks (created_by)
        ├──< projects (project_lead_id)
        ├──< expense_claims (user_id)
        └──< users (line_manager_id) [self-reference]

projects ──┐
           ├──< project_tasks
           ├──< project_pillars
           ├──< project_members
           └──< expense_claims
```

### Row Level Security (RLS)

All tables implement Row Level Security policies to ensure users can only access data they're authorized to see:

- **Users Table**: Users can view active team members; managers can approve pending users
- **Tasks Table**: Users see only their assigned/created tasks; managers see team tasks
- **Projects Table**: Users see only projects they're members of; leads see all project data
- **Expense Claims**: Users see only their claims; managers/finance see claims in their approval queue

---

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy **Project URL** and **anon/public** key
5. Paste into your `.env` file

> ⚠️ **Security Note:** Never commit your `.env` file to version control. It's already in `.gitignore`.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (TypeScript + ESLint)
- Write meaningful commit messages
- Update documentation for new features
- Test your changes thoroughly
- Keep PRs focused on a single feature/fix

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for **LightCastle Partners**
- Powered by [Supabase](https://supabase.com) - Open Source Firebase Alternative
- UI Components inspired by [Tailwind UI](https://tailwindui.com)
- Icons by [Lucide](https://lucide.dev)

---

## 📞 Support

For questions or support, please contact:

- **Email**: tahnimmahirpuc@gmail.com


---

<div align="center">

**Made with ☕ and 💻 by the LightCastle Tech Team**

⭐ Star this repo if you find it helpful!

</div>
