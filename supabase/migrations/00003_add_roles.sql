-- ============================================
-- ROLES SUPPORT MIGRATION
-- ============================================

-- Create roles enum type
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to profiles
ALTER TABLE public.profiles
ADD COLUMN role user_role DEFAULT 'user' NOT NULL;

-- Create index for role queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================
-- ADMIN AUDIT LOG
-- ============================================

CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'user', 'transaction', 'kyc', etc.
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE RLS POLICIES FOR ADMIN ACCESS
-- ============================================

-- Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

-- Profiles: Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- KYC Documents: Admins can view all KYC docs
CREATE POLICY "Admins can view all KYC docs"
ON public.kyc_documents FOR SELECT
USING (public.is_admin());

-- KYC Documents: Admins can update KYC docs (approve/reject)
CREATE POLICY "Admins can update KYC docs"
ON public.kyc_documents FOR UPDATE
USING (public.is_admin());

-- Accounts: Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
ON public.accounts FOR SELECT
USING (public.is_admin());

-- Transactions: Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (public.is_admin());

-- Transfers: Admins can view all transfers
CREATE POLICY "Admins can view all transfers"
ON public.transfers FOR SELECT
USING (public.is_admin());

-- Transfers: Admins can update transfers (approve/reject)
CREATE POLICY "Admins can update transfers"
ON public.transfers FOR UPDATE
USING (public.is_admin());

-- Beneficiaries: Admins can view all beneficiaries
CREATE POLICY "Admins can view all beneficiaries"
ON public.beneficiaries FOR SELECT
USING (public.is_admin());

-- Crypto Wallets: Admins can view all crypto wallets
CREATE POLICY "Admins can view all crypto wallets"
ON public.crypto_wallets FOR SELECT
USING (public.is_admin());

-- Crypto Transactions: Admins can view all crypto transactions
CREATE POLICY "Admins can view all crypto transactions"
ON public.crypto_transactions FOR SELECT
USING (public.is_admin());

-- Notifications: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
USING (public.is_admin());

-- Notifications: Admins can create notifications for any user
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.is_admin());

-- Admin Audit Logs: Only admins can view audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can create audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (public.is_admin());
