-- 1. Add Department to Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department text;

-- 2. Create Expense Claims Table
CREATE TABLE IF NOT EXISTS expense_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  project_id uuid REFERENCES public.projects(id),
  title text NOT NULL,
  amount decimal(12,2) NOT NULL,
  currency text DEFAULT 'BDT',
  category text NOT NULL,
  description text,
  receipt_url text,
  status text NOT NULL DEFAULT 'PENDING_MANAGER', 
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Drop existing policies to be safe (if re-running)
DROP POLICY IF EXISTS "View Claims" ON expense_claims;
DROP POLICY IF EXISTS "Create Claims" ON expense_claims;
DROP POLICY IF EXISTS "Update Claims" ON expense_claims;

-- VIEW Policies
CREATE POLICY "View Claims" ON expense_claims
FOR SELECT USING (
  -- 1. My Claims
  user_id = auth.uid()
  OR
  -- 2. Super User (Check public.users)
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'Super User')
  OR
  -- 3. Line Manager (Check if I am the line manager of the claim owner)
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = expense_claims.user_id 
    AND u.line_manager_id = auth.uid()
  )
  OR
  -- 4. Finance Manager (Check public.users department)
  (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.department = 'Finance')
    AND 
    status IN ('PENDING_FINANCE', 'PENDING_SUPERUSER', 'APPROVED')
  )
);

-- INSERT Policies
CREATE POLICY "Create Claims" ON expense_claims
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE Policies
CREATE POLICY "Update Claims" ON expense_claims
FOR UPDATE USING (
  -- Super User
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'Super User')
  OR
  -- Owner
  user_id = auth.uid()
  OR
  -- Line Manager
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = expense_claims.user_id AND u.line_manager_id = auth.uid())
  OR
  -- Finance Team
  (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.department = 'Finance'))
);

-- 5. Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('finance-receipts', 'finance-receipts', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload Receipts" ON storage.objects;
DROP POLICY IF EXISTS "View Receipts" ON storage.objects;

CREATE POLICY "Upload Receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'finance-receipts' AND auth.role() = 'authenticated');
CREATE POLICY "View Receipts" ON storage.objects FOR SELECT USING (bucket_id = 'finance-receipts');
