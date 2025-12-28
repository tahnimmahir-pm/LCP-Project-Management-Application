export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'Regular User' | 'Project Lead' | 'Manager' | 'Finance' | 'Super User';
export type UserStatus = 'Pending' | 'Active' | 'Rejected' | 'Inactive';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          role: UserRole;
          department: string | null;
          phone: string | null;
          status: UserStatus;
          line_manager_id: string | null;
          created_at: string;
          last_login: string | null;
          google_calendar_token: string | null;
          preferences: Json;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name: string;
          role?: UserRole;
          department?: string | null;
          phone?: string | null;
          status?: UserStatus;
          line_manager_id?: string | null;
          created_at?: string;
          last_login?: string | null;
          google_calendar_token?: string | null;
          preferences?: Json;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          full_name?: string;
          role?: UserRole;
          department?: string | null;
          phone?: string | null;
          status?: UserStatus;
          line_manager_id?: string | null;
          created_at?: string;
          last_login?: string | null;
          google_calendar_token?: string | null;
          preferences?: Json;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: 'Active' | 'Completed' | 'On Hold';
          start_date: string | null;
          end_date: string | null;
          drive_folder_url: string | null;
          lead_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: 'Active' | 'Completed' | 'On Hold';
          start_date?: string | null;
          end_date?: string | null;
          drive_folder_url?: string | null;
          lead_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: 'Active' | 'Completed' | 'On Hold';
          start_date?: string | null;
          end_date?: string | null;
          drive_folder_url?: string | null;
          lead_id?: string | null;
          created_at?: string;
        };
      };
      project_pillars: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          weight?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          weight?: number;
          created_at?: string;
        };
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: 'Lead' | 'Member';
          joined_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: 'Lead' | 'Member';
          joined_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: 'Lead' | 'Member';
          joined_at?: string;
        };
      };
      project_tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          project_id: string;
          pillar_id: string | null;
          assignee_id: string | null;
          created_by: string | null;
          status: 'Todo' | 'In Progress' | 'In Review' | 'Done';
          priority: 'Low' | 'Medium' | 'High';
          due_date: string | null;
          attachments: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          project_id: string;
          pillar_id?: string | null;
          assignee_id?: string | null;
          created_by?: string | null;
          status?: 'Todo' | 'In Progress' | 'In Review' | 'Done';
          priority?: 'Low' | 'Medium' | 'High';
          due_date?: string | null;
          attachments?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          project_id?: string;
          pillar_id?: string | null;
          assignee_id?: string | null;
          created_by?: string | null;
          status?: 'Todo' | 'In Progress' | 'In Review' | 'Done';
          priority?: 'Low' | 'Medium' | 'High';
          due_date?: string | null;
          attachments?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_claims: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          amount: number;
          currency: string;
          category: string;
          description: string | null;
          receipt_url: string | null;
          status: 'DRAFT' | 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'PENDING_SUPERUSER' | 'APPROVED' | 'REJECTED';
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          amount: number;
          currency?: string;
          category: string;
          description?: string | null;
          receipt_url?: string | null;
          status?: 'DRAFT' | 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'PENDING_SUPERUSER' | 'APPROVED' | 'REJECTED';
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          amount?: number;
          currency?: string;
          category?: string;
          description?: string | null;
          receipt_url?: string | null;
          status?: 'DRAFT' | 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'PENDING_SUPERUSER' | 'APPROVED' | 'REJECTED';
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
