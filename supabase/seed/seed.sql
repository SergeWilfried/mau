-- ============================================
-- DOUNI API - DATABASE SEED DATA
-- ============================================
-- Run this AFTER running all migrations
-- Demo users: user@demo.com / userdemo1@ and admin@demo.com / useradmin1@
-- ============================================

-- Note: Users must be created via Supabase Auth API first
-- This seed assumes users are already created with these IDs:
-- User ID: 00000000-0000-0000-0000-000000000001 (user@demo.com)
-- Admin ID: 00000000-0000-0000-0000-000000000002 (admin@demo.com)

-- For testing, we'll use placeholder UUIDs that should be replaced
-- with actual user IDs after creating users via Auth API

-- ============================================
-- DEMO PROFILES (after auth users created)
-- ============================================

-- These will be auto-created by trigger, but we update them with more data
UPDATE public.profiles SET
    first_name = 'John',
    last_name = 'Doe',
    phone = '+33612345678',
    date_of_birth = '1990-05-15',
    address = '{"street": "123 Main St", "city": "Paris", "country": "FR", "postal_code": "75001"}',
    preferred_currency = 'EUR',
    language = 'en',
    kyc_status = 'verified',
    kyc_level = 'full',
    role = 'user'
WHERE email = 'user@demo.com';

UPDATE public.profiles SET
    first_name = 'Admin',
    last_name = 'User',
    phone = '+33698765432',
    date_of_birth = '1985-10-20',
    address = '{"street": "456 Admin Ave", "city": "Paris", "country": "FR", "postal_code": "75002"}',
    preferred_currency = 'EUR',
    language = 'en',
    kyc_status = 'verified',
    kyc_level = 'full',
    role = 'admin'
WHERE email = 'admin@demo.com';

-- ============================================
-- DEMO ACCOUNTS
-- ============================================

-- Get user IDs
DO $$
DECLARE
    demo_user_id UUID;
    demo_admin_id UUID;
    eur_account_id UUID;
    usd_account_id UUID;
    mad_account_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO demo_user_id FROM public.profiles WHERE email = 'user@demo.com';
    SELECT id INTO demo_admin_id FROM public.profiles WHERE email = 'admin@demo.com';

    -- Skip if users don't exist yet
    IF demo_user_id IS NULL THEN
        RAISE NOTICE 'Demo users not found. Please create users via Auth API first.';
        RETURN;
    END IF;

    -- Update existing EUR account (created by trigger) with balance
    UPDATE public.accounts SET
        balance = 5000.00,
        iban = 'GB82DOUN00000000000001',
        account_number = 'DOUN00000001'
    WHERE user_id = demo_user_id AND currency = 'EUR'
    RETURNING id INTO eur_account_id;

    -- Create additional accounts for demo user
    INSERT INTO public.accounts (user_id, currency, balance, is_main, iban, account_number, status)
    VALUES
        (demo_user_id, 'USD', 2500.00, FALSE, 'GB82DOUN00000000000002', 'DOUN00000002', 'active'),
        (demo_user_id, 'MAD', 15000.00, FALSE, 'GB82DOUN00000000000003', 'DOUN00000003', 'active')
    ON CONFLICT (user_id, currency) DO UPDATE SET balance = EXCLUDED.balance
    RETURNING id INTO usd_account_id;

    -- Get the MAD account ID
    SELECT id INTO mad_account_id FROM public.accounts WHERE user_id = demo_user_id AND currency = 'MAD';

    -- ============================================
    -- DEMO TRANSACTIONS
    -- ============================================

    INSERT INTO public.transactions (user_id, account_id, type, amount, currency, fee, description, status, created_at, completed_at)
    VALUES
        -- EUR transactions
        (demo_user_id, eur_account_id, 'deposit', 2000.00, 'EUR', 0, 'Wire transfer deposit', 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
        (demo_user_id, eur_account_id, 'deposit', 3500.00, 'EUR', 0, 'Mobile money deposit', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
        (demo_user_id, eur_account_id, 'transfer_out', -500.00, 'EUR', 0, 'Transfer to John Smith', 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
        (demo_user_id, eur_account_id, 'exchange_out', -200.00, 'EUR', 1.00, 'Exchange to USD', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
        (demo_user_id, eur_account_id, 'withdrawal', -300.00, 'EUR', 2.50, 'Bank withdrawal', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
        (demo_user_id, eur_account_id, 'p2p_in', 150.00, 'EUR', 0, 'Payment from Marie', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
        (demo_user_id, eur_account_id, 'transfer_out', -50.00, 'EUR', 0, 'Mobile money to +221771234567', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
        -- USD transactions
        (demo_user_id, usd_account_id, 'exchange_in', 216.00, 'USD', 0, 'Exchange from EUR', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
        (demo_user_id, usd_account_id, 'deposit', 2500.00, 'USD', 0, 'Crypto sale deposit', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
        -- MAD transactions
        (demo_user_id, mad_account_id, 'deposit', 15000.00, 'MAD', 0, 'Wire transfer deposit', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- DEMO BENEFICIARIES
    -- ============================================

    INSERT INTO public.beneficiaries (user_id, type, name, iban, bic, bank_name, currency, is_favorite, mobile_money_provider, mobile_money_phone, mobile_money_country)
    VALUES
        (demo_user_id, 'bank', 'John Smith', 'FR7630006000011234567890189', 'BNPAFRPP', 'BNP Paribas', 'EUR', TRUE, NULL, NULL, NULL),
        (demo_user_id, 'bank', 'Marie Dupont', 'DE89370400440532013000', 'COBADEFFXXX', 'Commerzbank', 'EUR', FALSE, NULL, NULL, NULL),
        (demo_user_id, 'bank', 'Ahmed Hassan', 'MA64011519000001205000534921', 'BMABORXX', 'Bank of Africa', 'MAD', TRUE, NULL, NULL, NULL),
        (demo_user_id, 'mobilemoney', 'Fatou Diallo', NULL, NULL, NULL, 'XOF', TRUE, 'wave_sn', '+221771234567', 'SN'),
        (demo_user_id, 'mobilemoney', 'Kwame Asante', NULL, NULL, NULL, 'GHS', FALSE, 'mtn_gh', '+233241234567', 'GH'),
        (demo_user_id, 'p2p', 'Alice Martin', NULL, NULL, NULL, 'EUR', FALSE, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- DEMO CRYPTO WALLETS
    -- ============================================

    INSERT INTO public.crypto_wallets (user_id, symbol, network, address, balance)
    VALUES
        (demo_user_id, 'BTC', 'bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 0.05),
        (demo_user_id, 'ETH', 'ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0', 1.5),
        (demo_user_id, 'USDT', 'ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0', 500.00),
        (demo_user_id, 'SOL', 'solana', '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 10.0)
    ON CONFLICT (user_id, symbol, network) DO UPDATE SET balance = EXCLUDED.balance;

    -- ============================================
    -- DEMO CRYPTO TRANSACTIONS
    -- ============================================

    INSERT INTO public.crypto_transactions (user_id, type, symbol, amount, price_per_unit, fiat_amount, fiat_currency, fee, status, created_at, completed_at)
    VALUES
        (demo_user_id, 'buy', 'BTC', 0.05, 42000.00, 2100.00, 'EUR', 10.50, 'completed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
        (demo_user_id, 'buy', 'ETH', 1.5, 2200.00, 3300.00, 'EUR', 16.50, 'completed', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
        (demo_user_id, 'buy', 'USDT', 500.00, 1.00, 500.00, 'EUR', 2.50, 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
        (demo_user_id, 'buy', 'SOL', 10.0, 100.00, 1000.00, 'EUR', 5.00, 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
        (demo_user_id, 'sell', 'ETH', 0.5, 2400.00, 1200.00, 'EUR', 6.00, 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- DEMO NOTIFICATIONS
    -- ============================================

    INSERT INTO public.notifications (user_id, type, title, message, read, created_at)
    VALUES
        (demo_user_id, 'transaction', 'Payment Received', 'You received €150.00 from Marie', FALSE, NOW() - INTERVAL '3 days'),
        (demo_user_id, 'security', 'New Device Login', 'Your account was accessed from a new device in Paris, France', TRUE, NOW() - INTERVAL '7 days'),
        (demo_user_id, 'promo', 'Refer a Friend', 'Invite friends and earn €10 for each referral!', FALSE, NOW() - INTERVAL '14 days'),
        (demo_user_id, 'kyc', 'KYC Approved', 'Your identity verification has been approved. You now have full access.', TRUE, NOW() - INTERVAL '30 days'),
        (demo_user_id, 'transaction', 'Withdrawal Completed', 'Your withdrawal of €300.00 has been processed', TRUE, NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- DEMO PRICE ALERTS
    -- ============================================

    INSERT INTO public.price_alerts (user_id, asset_type, symbol, target_currency, target_price, condition, status)
    VALUES
        (demo_user_id, 'crypto', 'BTC', 'EUR', 50000.00, 'above', 'active'),
        (demo_user_id, 'crypto', 'ETH', 'EUR', 2000.00, 'below', 'active'),
        (demo_user_id, 'fiat', 'USD', 'EUR', 0.95, 'below', 'active')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seed data inserted successfully for user: %', demo_user_id;

END $$;

-- ============================================
-- EXCHANGE RATES (public data)
-- ============================================

INSERT INTO public.exchange_rates (base_currency, target_currency, rate, source)
VALUES
    ('EUR', 'USD', 1.08, 'seed'),
    ('EUR', 'GBP', 0.86, 'seed'),
    ('EUR', 'MAD', 10.85, 'seed'),
    ('EUR', 'XOF', 655.96, 'seed'),
    ('EUR', 'GHS', 13.50, 'seed'),
    ('EUR', 'KES', 165.00, 'seed'),
    ('EUR', 'CHF', 0.94, 'seed'),
    ('EUR', 'JPY', 162.50, 'seed'),
    ('USD', 'EUR', 0.93, 'seed'),
    ('USD', 'GBP', 0.80, 'seed'),
    ('USD', 'MAD', 10.05, 'seed'),
    ('GBP', 'EUR', 1.16, 'seed'),
    ('GBP', 'USD', 1.25, 'seed'),
    ('MAD', 'EUR', 0.092, 'seed'),
    ('XOF', 'EUR', 0.00152, 'seed')
ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();

RAISE NOTICE 'Exchange rates seeded successfully';
