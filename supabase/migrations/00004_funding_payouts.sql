-- ============================================
-- FUNDING & PAYOUTS MIGRATION
-- ============================================

-- ============================================
-- MOBILE MONEY PROVIDERS
-- ============================================

CREATE TABLE public.mobile_money_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g., 'mtn', 'orange', 'mpesa', 'wave'
    country TEXT NOT NULL,
    currency TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_amount DECIMAL(20, 8) DEFAULT 0,
    max_amount DECIMAL(20, 8),
    fee_percentage DECIMAL(5, 4) DEFAULT 0,
    fee_fixed DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common mobile money providers
INSERT INTO public.mobile_money_providers (name, code, country, currency, fee_percentage) VALUES
    ('MTN Mobile Money', 'mtn_ci', 'CI', 'XOF', 0.01),
    ('Orange Money', 'orange_ci', 'CI', 'XOF', 0.01),
    ('MTN Mobile Money', 'mtn_gh', 'GH', 'GHS', 0.01),
    ('Vodafone Cash', 'vodafone_gh', 'GH', 'GHS', 0.01),
    ('M-Pesa', 'mpesa_ke', 'KE', 'KES', 0.01),
    ('Wave', 'wave_sn', 'SN', 'XOF', 0.005),
    ('Orange Money', 'orange_sn', 'SN', 'XOF', 0.01),
    ('MTN Mobile Money', 'mtn_ug', 'UG', 'UGX', 0.01),
    ('Airtel Money', 'airtel_ug', 'UG', 'UGX', 0.01),
    ('Inwi Money', 'inwi_ma', 'MA', 'MAD', 0.01),
    ('Orange Money', 'orange_ma', 'MA', 'MAD', 0.01);

-- ============================================
-- FUNDING (DEPOSITS)
-- ============================================

CREATE TABLE public.funding_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    method TEXT NOT NULL CHECK (method IN ('wire', 'crypto', 'mobile_money')),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),

    -- Wire transfer details
    wire_reference TEXT,
    wire_sender_name TEXT,
    wire_sender_iban TEXT,

    -- Crypto details
    crypto_symbol TEXT,
    crypto_network TEXT,
    crypto_address TEXT,
    crypto_tx_hash TEXT,
    crypto_amount DECIMAL(30, 18),

    -- Mobile money details
    mobile_money_provider TEXT,
    mobile_money_phone TEXT,
    mobile_money_tx_id TEXT,

    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funding_requests_user_id ON public.funding_requests(user_id);
CREATE INDEX idx_funding_requests_status ON public.funding_requests(status);

-- ============================================
-- PAYOUTS (WITHDRAWALS)
-- ============================================

CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    method TEXT NOT NULL CHECK (method IN ('bank_account', 'mobile_money')),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Bank account details
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    bank_iban TEXT,
    bank_bic TEXT,
    bank_routing_number TEXT,
    bank_country TEXT,

    -- Mobile money details
    mobile_money_provider TEXT,
    mobile_money_phone TEXT,
    mobile_money_recipient_name TEXT,
    mobile_money_tx_id TEXT,

    reference TEXT,
    note TEXT,
    estimated_arrival TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);

-- ============================================
-- SAVED MOBILE MONEY ACCOUNTS
-- ============================================

ALTER TABLE public.beneficiaries
ADD COLUMN mobile_money_provider TEXT,
ADD COLUMN mobile_money_phone TEXT,
ADD COLUMN mobile_money_country TEXT;

-- Update beneficiaries type check
ALTER TABLE public.beneficiaries DROP CONSTRAINT IF EXISTS beneficiaries_type_check;
ALTER TABLE public.beneficiaries ADD CONSTRAINT beneficiaries_type_check
    CHECK (type IN ('bank', 'p2p', 'mobilemoney', 'crypto'));

-- ============================================
-- UPDATE TRANSFERS TABLE
-- ============================================

-- Add crypto transfer fields to transfers table
ALTER TABLE public.transfers
ADD COLUMN crypto_symbol TEXT,
ADD COLUMN crypto_network TEXT,
ADD COLUMN crypto_tx_hash TEXT,
ADD COLUMN crypto_address TEXT;

-- Update transfers type check
ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS transfers_type_check;
ALTER TABLE public.transfers ADD CONSTRAINT transfers_type_check
    CHECK (type IN ('internal', 'p2p', 'bank_sepa', 'bank_swift', 'crypto', 'mobile_money'));

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_money_providers ENABLE ROW LEVEL SECURITY;

-- Users can manage their own funding requests
CREATE POLICY "Users can view own funding requests"
ON public.funding_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create funding requests"
ON public.funding_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can manage their own payout requests
CREATE POLICY "Users can view own payout requests"
ON public.payout_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests"
ON public.payout_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can view mobile money providers
CREATE POLICY "Anyone can view mobile money providers"
ON public.mobile_money_providers FOR SELECT
USING (true);

-- Admins can manage all funding/payout requests
CREATE POLICY "Admins can view all funding requests"
ON public.funding_requests FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update funding requests"
ON public.funding_requests FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can view all payout requests"
ON public.payout_requests FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update payout requests"
ON public.payout_requests FOR UPDATE
USING (public.is_admin());

-- Admins can manage mobile money providers
CREATE POLICY "Admins can manage mobile money providers"
ON public.mobile_money_providers FOR ALL
USING (public.is_admin());
