# LightCastle Partners - Dashboard User Guide

This application is a central hub for Project Management, Task Tracking, and Finance Approvals. It allows the team to work together while ensuring that sensitive information (like financial claims) stays secure and follows a strict approval process.

---

## 👥 User Roles & Hierarchy

The system creates a clear workspace where everyone sees exactly what they need to see.

1.  **Super User (Admin)**
    *   Has full access to everything.
    *   Can see all Tasks, Projects, and Financial Claims.
    *   Can override approvals if necessary.

2.  **Finance Manager**
    *   **Dashboard**: Sees the "Finance" tab with a special "Approvals" section.
    *   **Responsibility**: Reviews expense claims *after* they have been approved by the Line Manager.
    *   **Visibility**: Cannot see claims that are still waiting for the Line Manager.

3.  **Line Manager / Project Lead**
    *   **Team Management**: Can see tasks assigned to their **Direct Reports** (Team Members).
    *   **Expense Approvals**: Automatically receives expense claims from their team members in the "Approvals" tab.
    *   **Task Assignment**: Can assign tasks to anyone in their team.

4.  **Regular User (Employee)**
    *   **Focus**: Sees only their own assigned tasks and projects they are part of.
    *   **Privacy**: Cannot see other people's tasks or financial claims.

---

## 💰 How the Finance Module Works

The Finance section follows a strict **3-Step Approval Workflow**:

### Step 1: Employee Submits a Claim
*   Goes to the **Finance** tab and clicks **"New Claim"**.
*   Uploads a receipt (Image/PDF) and enters details (Amount, Project, Category).
*   **Status**: `PENDING_MANAGER`

### Step 2: Line Manager Approval
*   The **Line Manager** logs in.
*   The system automatically opens their **Approvals** tab.
*   They review the receipt and click **Approve** (Green Check) or **Reject** (Red X).
*   **Status becomes**: `PENDING_FINANCE`

### Step 3: Finance Department Approval
*   The **Finance Manager** logs in.
*   They see the claim in their **Approvals** tab (only now that the Manager has approved it).
*   They give the final approval for reimbursement.
*   **Status becomes**: `APPROVED` / `PENDING_SUPERUSER`

---

## ✅ Task Management & Privacy

### "My Tasks" vs "My Team's Tasks"
*   **Regular Users**: By default, you only see **"Tasks Assigned to Me"**.
*   **Managers**: You have a switch to see **"Tasks Assigned by Me"** to track what your team is working on.

### Project Pillars
*   Every task is linked to a **Strategic Pillar** (e.g., "Growth", "Sustainability"). This helps the company track which goals are receiving the most effort.

---

## � Dashboard Overview

*   **Active Projects**: Snapshot of ongoing work.
*   **Team Efficiency**: A live score calculated based on how many assigned tasks are completed on time.
*   **Widgets**: Two rapid-access lists for your most urgent tasks.
