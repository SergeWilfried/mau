import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Demo users configuration
const demoUsers = [
    {
        email: 'user@demo.com',
        password: 'userdemo1@',
        role: 'user' as const,
        profile: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '+33612345678',
            date_of_birth: '1990-05-15',
            address: { street: '123 Main St', city: 'Paris', country: 'FR', postal_code: '75001' },
            preferred_currency: 'EUR',
            language: 'en',
            kyc_status: 'verified',
            kyc_level: 'full'
        }
    },
    {
        email: 'admin@demo.com',
        password: 'useradmin1@',
        role: 'admin' as const,
        profile: {
            first_name: 'Admin',
            last_name: 'User',
            phone: '+33698765432',
            date_of_birth: '1985-10-20',
            address: { street: '456 Admin Ave', city: 'Paris', country: 'FR', postal_code: '75002' },
            preferred_currency: 'EUR',
            language: 'en',
            kyc_status: 'verified',
            kyc_level: 'full'
        }
    }
];

async function createUser(userData: (typeof demoUsers)[0]) {
    console.log(`Creating user: ${userData.email}...`);

    // Check if user already exists
    const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .single();

    if (existingUsers) {
        console.log(`  User ${userData.email} already exists, updating profile...`);

        // Update profile
        await supabase
            .from('profiles')
            .update({
                ...userData.profile,
                role: userData.role
            })
            .eq('id', existingUsers.id);

        return existingUsers.id;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        phone: userData.profile.phone,
        phone_confirm: true
    });

    if (authError) {
        console.error(`  Error creating auth user: ${authError.message}`);
        return null;
    }

    console.log(`  Auth user created with ID: ${authData.user.id}`);

    // Update profile with additional data
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            ...userData.profile,
            role: userData.role
        })
        .eq('id', authData.user.id);

    if (profileError) {
        console.error(`  Error updating profile: ${profileError.message}`);
    }

    return authData.user.id;
}

async function seedAccounts(userId: string) {
    console.log(`  Seeding accounts for user ${userId}...`);

    // Update main EUR account with balance
    await supabase
        .from('accounts')
        .update({
            balance: 5000.0,
            iban: 'GB82DOUN00000000000001',
            account_number: 'DOUN00000001'
        })
        .eq('user_id', userId)
        .eq('currency', 'EUR');

    // Create additional accounts
    const additionalAccounts = [
        { currency: 'USD', balance: 2500.0, iban: 'GB82DOUN00000000000002', account_number: 'DOUN00000002' },
        { currency: 'MAD', balance: 15000.0, iban: 'GB82DOUN00000000000003', account_number: 'DOUN00000003' },
        { currency: 'XOF', balance: 50000.0, iban: 'GB82DOUN00000000000004', account_number: 'DOUN00000004' }
    ];

    for (const account of additionalAccounts) {
        const { error } = await supabase.from('accounts').upsert(
            {
                user_id: userId,
                ...account,
                is_main: false,
                status: 'active'
            },
            { onConflict: 'user_id,currency' }
        );

        if (error) {
            console.error(`    Error creating ${account.currency} account: ${error.message}`);
        }
    }
}

async function seedTransactions(userId: string) {
    console.log(`  Seeding transactions...`);

    // Get account IDs
    const { data: accounts } = await supabase.from('accounts').select('id, currency').eq('user_id', userId);

    if (!accounts) return;

    const eurAccount = accounts.find((a) => a.currency === 'EUR');
    const usdAccount = accounts.find((a) => a.currency === 'USD');
    const madAccount = accounts.find((a) => a.currency === 'MAD');

    const transactions = [
        {
            account_id: eurAccount?.id,
            type: 'deposit',
            amount: 2000.0,
            currency: 'EUR',
            description: 'Wire transfer deposit',
            days_ago: 30
        },
        {
            account_id: eurAccount?.id,
            type: 'deposit',
            amount: 3500.0,
            currency: 'EUR',
            description: 'Mobile money deposit',
            days_ago: 20
        },
        {
            account_id: eurAccount?.id,
            type: 'transfer_out',
            amount: -500.0,
            currency: 'EUR',
            description: 'Transfer to John Smith',
            days_ago: 15
        },
        {
            account_id: eurAccount?.id,
            type: 'exchange_out',
            amount: -200.0,
            currency: 'EUR',
            fee: 1.0,
            description: 'Exchange to USD',
            days_ago: 10
        },
        {
            account_id: eurAccount?.id,
            type: 'withdrawal',
            amount: -300.0,
            currency: 'EUR',
            fee: 2.5,
            description: 'Bank withdrawal',
            days_ago: 5
        },
        {
            account_id: eurAccount?.id,
            type: 'p2p_in',
            amount: 150.0,
            currency: 'EUR',
            description: 'Payment from Marie',
            days_ago: 3
        },
        {
            account_id: usdAccount?.id,
            type: 'exchange_in',
            amount: 216.0,
            currency: 'USD',
            description: 'Exchange from EUR',
            days_ago: 10
        },
        {
            account_id: usdAccount?.id,
            type: 'deposit',
            amount: 2500.0,
            currency: 'USD',
            description: 'Crypto sale deposit',
            days_ago: 8
        },
        {
            account_id: madAccount?.id,
            type: 'deposit',
            amount: 15000.0,
            currency: 'MAD',
            description: 'Wire transfer deposit',
            days_ago: 25
        }
    ];

    for (const tx of transactions) {
        if (!tx.account_id) continue;

        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - tx.days_ago);

        await supabase.from('transactions').insert({
            user_id: userId,
            account_id: tx.account_id,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency,
            fee: tx.fee || 0,
            description: tx.description,
            status: 'completed',
            created_at: createdAt.toISOString(),
            completed_at: createdAt.toISOString()
        });
    }
}

async function seedBeneficiaries(userId: string) {
    console.log(`  Seeding beneficiaries...`);

    const beneficiaries = [
        {
            type: 'bank',
            name: 'John Smith',
            iban: 'FR7630006000011234567890189',
            bic: 'BNPAFRPP',
            bank_name: 'BNP Paribas',
            currency: 'EUR',
            is_favorite: true
        },
        {
            type: 'bank',
            name: 'Marie Dupont',
            iban: 'DE89370400440532013000',
            bic: 'COBADEFFXXX',
            bank_name: 'Commerzbank',
            currency: 'EUR',
            is_favorite: false
        },
        {
            type: 'bank',
            name: 'Ahmed Hassan',
            iban: 'MA64011519000001205000534921',
            bic: 'BMABORXX',
            bank_name: 'Bank of Africa',
            currency: 'MAD',
            is_favorite: true
        },
        {
            type: 'mobilemoney',
            name: 'Fatou Diallo',
            currency: 'XOF',
            is_favorite: true,
            mobile_money_provider: 'wave_sn',
            mobile_money_phone: '+221771234567',
            mobile_money_country: 'SN'
        },
        {
            type: 'mobilemoney',
            name: 'Kwame Asante',
            currency: 'GHS',
            is_favorite: false,
            mobile_money_provider: 'mtn_gh',
            mobile_money_phone: '+233241234567',
            mobile_money_country: 'GH'
        },
        {
            type: 'mobilemoney',
            name: 'Omar Ba',
            currency: 'XOF',
            is_favorite: false,
            mobile_money_provider: 'orange_sn',
            mobile_money_phone: '+221761234567',
            mobile_money_country: 'SN'
        }
    ];

    for (const ben of beneficiaries) {
        await supabase.from('beneficiaries').insert({
            user_id: userId,
            ...ben
        });
    }
}

async function seedCryptoWallets(userId: string) {
    console.log(`  Seeding crypto wallets...`);

    const wallets = [
        { symbol: 'BTC', network: 'bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', balance: 0.05 },
        { symbol: 'ETH', network: 'ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0', balance: 1.5 },
        { symbol: 'USDT', network: 'ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0', balance: 500.0 },
        { symbol: 'SOL', network: 'solana', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', balance: 10.0 }
    ];

    for (const wallet of wallets) {
        await supabase.from('crypto_wallets').upsert(
            {
                user_id: userId,
                ...wallet
            },
            { onConflict: 'user_id,symbol,network' }
        );
    }
}

async function seedNotifications(userId: string) {
    console.log(`  Seeding notifications...`);

    const notifications = [
        {
            type: 'transaction',
            title: 'Payment Received',
            message: 'You received €150.00 from Marie',
            read: false,
            days_ago: 3
        },
        {
            type: 'security',
            title: 'New Device Login',
            message: 'Your account was accessed from a new device in Paris, France',
            read: true,
            days_ago: 7
        },
        {
            type: 'promo',
            title: 'Refer a Friend',
            message: 'Invite friends and earn €10 for each referral!',
            read: false,
            days_ago: 14
        },
        {
            type: 'kyc',
            title: 'KYC Approved',
            message: 'Your identity verification has been approved. You now have full access.',
            read: true,
            days_ago: 30
        },
        {
            type: 'transaction',
            title: 'Withdrawal Completed',
            message: 'Your withdrawal of €300.00 has been processed',
            read: true,
            days_ago: 5
        }
    ];

    for (const notif of notifications) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - notif.days_ago);

        await supabase.from('notifications').insert({
            user_id: userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            read: notif.read,
            created_at: createdAt.toISOString()
        });
    }
}

async function seedExchangeRates() {
    console.log('Seeding exchange rates...');

    const rates = [
        { base_currency: 'EUR', target_currency: 'USD', rate: 1.08 },
        { base_currency: 'EUR', target_currency: 'GBP', rate: 0.86 },
        { base_currency: 'EUR', target_currency: 'MAD', rate: 10.85 },
        { base_currency: 'EUR', target_currency: 'XOF', rate: 655.96 },
        { base_currency: 'EUR', target_currency: 'GHS', rate: 13.5 },
        { base_currency: 'EUR', target_currency: 'KES', rate: 165.0 },
        { base_currency: 'EUR', target_currency: 'CHF', rate: 0.94 },
        { base_currency: 'EUR', target_currency: 'JPY', rate: 162.5 },
        { base_currency: 'USD', target_currency: 'EUR', rate: 0.93 },
        { base_currency: 'USD', target_currency: 'GBP', rate: 0.8 },
        { base_currency: 'USD', target_currency: 'MAD', rate: 10.05 },
        { base_currency: 'GBP', target_currency: 'EUR', rate: 1.16 },
        { base_currency: 'GBP', target_currency: 'USD', rate: 1.25 },
        { base_currency: 'MAD', target_currency: 'EUR', rate: 0.092 },
        { base_currency: 'XOF', target_currency: 'EUR', rate: 0.00152 }
    ];

    for (const rate of rates) {
        await supabase.from('exchange_rates').upsert(
            {
                ...rate,
                source: 'seed',
                updated_at: new Date().toISOString()
            },
            { onConflict: 'base_currency,target_currency' }
        );
    }
}

async function main() {
    console.log('='.repeat(50));
    console.log('DOUNI API - Database Seed');
    console.log('='.repeat(50));
    console.log('');

    // Seed exchange rates (public data, no user required)
    await seedExchangeRates();
    console.log('');

    // Create demo users and seed their data
    for (const userData of demoUsers) {
        const userId = await createUser(userData);

        if (userId && userData.role === 'user') {
            await seedAccounts(userId);
            await seedTransactions(userId);
            await seedBeneficiaries(userId);
            await seedCryptoWallets(userId);
            await seedNotifications(userId);
        }

        console.log('');
    }

    console.log('='.repeat(50));
    console.log('Seed completed successfully!');
    console.log('');
    console.log('Demo Accounts:');
    console.log('  User:  user@demo.com / userdemo1@');
    console.log('  Admin: admin@demo.com / useradmin1@');
    console.log('='.repeat(50));
}

main().catch(console.error);
