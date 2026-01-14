-- ============================================
-- DOUNI API - Initial Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    address JSONB DEFAULT '{}',
    preferred_currency TEXT DEFAULT 'EUR',
    language TEXT DEFAULT 'en',
    pin_hash TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
    kyc_level TEXT DEFAULT 'none' CHECK (kyc_level IN ('none', 'basic', 'intermediate', 'full')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('passport', 'id_card', 'drivers_license', 'proof_of_address', 'selfie')),
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE public.user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name TEXT,
    device_type TEXT,
    push_token TEXT,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACCOUNTS & BALANCES
-- ============================================

CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    is_main BOOLEAN DEFAULT FALSE,
    iban TEXT UNIQUE,
    account_number TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'deposit', 'withdrawal', 'transfer_in', 'transfer_out',
        'exchange_in', 'exchange_out', 'p2p_in', 'p2p_out',
        'crypto_buy', 'crypto_sell', 'crypto_deposit', 'crypto_withdrawal',
        'staking_reward', 'fee'
    )),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    balance_after DECIMAL(20, 8),
    description TEXT,
    reference TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    related_transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- ============================================
-- TRANSFERS
-- ============================================

CREATE TABLE public.transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('internal', 'p2p', 'bank_sepa', 'bank_swift')),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    fee DECIMAL(20, 8) DEFAULT 0,
    exchange_rate DECIMAL(20, 8),
    recipient_iban TEXT,
    recipient_bic TEXT,
    recipient_name TEXT,
    reference TEXT,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payer_identifier TEXT,
    payer_type TEXT CHECK (payer_type IN ('phone', 'email', 'username')),
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scheduled_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    transfer_details JSONB NOT NULL,
    frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly')),
    next_execution_at TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BENEFICIARIES
-- ============================================

CREATE TABLE public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bank', 'p2p', 'mobilemoney', 'crypto')),
    name TEXT NOT NULL,
    iban TEXT,
    bic TEXT,
    bank_name TEXT,
    bank_address TEXT,
    phone TEXT,
    email TEXT,
    crypto_address TEXT,
    crypto_network TEXT,
    currency TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_user_id ON public.beneficiaries(user_id);

-- ============================================
-- CRYPTO
-- ============================================

CREATE TABLE public.crypto_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    balance DECIMAL(30, 18) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol, network)
);

CREATE TABLE public.crypto_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.crypto_wallets(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'swap', 'deposit', 'withdrawal', 'staking', 'unstaking', 'reward')),
    symbol TEXT NOT NULL,
    amount DECIMAL(30, 18) NOT NULL,
    price_per_unit DECIMAL(20, 8),
    fiat_amount DECIMAL(20, 8),
    fiat_currency TEXT,
    fee DECIMAL(30, 18) DEFAULT 0,
    fee_currency TEXT,
    to_symbol TEXT,
    to_amount DECIMAL(30, 18),
    external_address TEXT,
    tx_hash TEXT,
    network TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE public.crypto_stakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    amount DECIMAL(30, 18) NOT NULL,
    apy DECIMAL(10, 4),
    earned DECIMAL(30, 18) DEFAULT 0,
    lock_period_days INTEGER,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unstaking', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.recurring_crypto_buys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    fiat_amount DECIMAL(20, 8) NOT NULL,
    fiat_currency TEXT NOT NULL,
    from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    next_execution_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS & ALERTS
-- ============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    push_transactions BOOLEAN DEFAULT TRUE,
    push_marketing BOOLEAN DEFAULT FALSE,
    push_security BOOLEAN DEFAULT TRUE,
    push_price_alerts BOOLEAN DEFAULT TRUE,
    email_transactions BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    email_security BOOLEAN DEFAULT TRUE,
    email_monthly_statement BOOLEAN DEFAULT TRUE,
    sms_security BOOLEAN DEFAULT TRUE,
    sms_large_transactions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'fiat')),
    symbol TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    target_price DECIMAL(20, 8) NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled')),
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXCHANGE RATES CACHE
-- ============================================

CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    source TEXT DEFAULT 'internal',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(base_currency, target_currency)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_crypto_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- KYC Documents
CREATE POLICY "Users can view own KYC docs" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC docs" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Devices
CREATE POLICY "Users can manage own devices" ON public.user_devices FOR ALL USING (auth.uid() = user_id);

-- Accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Transfers
CREATE POLICY "Users can view own transfers" ON public.transfers FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can insert own transfers" ON public.transfers FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Payment Requests
CREATE POLICY "Users can view own payment requests" ON public.payment_requests FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = payer_id);
CREATE POLICY "Users can insert own payment requests" ON public.payment_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own payment requests" ON public.payment_requests FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = payer_id);

-- Scheduled Transfers
CREATE POLICY "Users can manage own scheduled transfers" ON public.scheduled_transfers FOR ALL USING (auth.uid() = user_id);

-- Beneficiaries
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries FOR ALL USING (auth.uid() = user_id);

-- Crypto Wallets
CREATE POLICY "Users can view own crypto wallets" ON public.crypto_wallets FOR SELECT USING (auth.uid() = user_id);

-- Crypto Transactions
CREATE POLICY "Users can view own crypto transactions" ON public.crypto_transactions FOR SELECT USING (auth.uid() = user_id);

-- Crypto Stakes
CREATE POLICY "Users can manage own stakes" ON public.crypto_stakes FOR ALL USING (auth.uid() = user_id);

-- Recurring Crypto Buys
CREATE POLICY "Users can manage own recurring buys" ON public.recurring_crypto_buys FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Notification Preferences
CREATE POLICY "Users can manage own notification prefs" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Price Alerts
CREATE POLICY "Users can manage own price alerts" ON public.price_alerts FOR ALL USING (auth.uid() = user_id);

-- Exchange Rates: public read access
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exchange rates" ON public.exchange_rates FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone)
    VALUES (NEW.id, NEW.email, NEW.phone);

    -- Create default EUR account
    INSERT INTO public.accounts (user_id, currency, is_main)
    VALUES (NEW.id, 'EUR', TRUE);

    -- Create default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_wallets;
