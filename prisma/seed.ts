import prisma from '@/lib/prisma';

async function main() {
    console.log('🌱 Starting multi-tenant seed...');

    // 0. Cleanup (Optional, but good for idempotent runs if possible, though migrate reset handles this)
    // await prisma.transaction.deleteMany();
    // ...

    // 1. Create Companies
    const companyA = await prisma.company.create({
        data: { name: 'PT Maju Sejahtera', subscriptionPlan: 'pro' }
    });

    const companyB = await prisma.company.create({
        data: { name: 'CV Sumber Rejeki', subscriptionPlan: 'basic' }
    });

    console.log('✅ Companies created');

    // 2. Create Users
    // In real app, password should be hashed. For seed/dev, we'll use "password"
    // We will assume "password123" is the hash or handle hashing in Auth logic if using library.
    // For MVP simplicity in seed, let's just use string "password". middleware/auth.ts will need to handle comparison.
    // Ideally: const hashedPassword = await hash('password', 10);

    const owner = await prisma.user.create({
        data: {
            name: 'Super Owner',
            email: 'owner@fintrack.com',
            password: 'password', // TODO: Hash this in real implementation
            role: 'OWNER',
            companyId: null // Owner might not be bound to one company, or bound to a "Holding" company
        }
    });

    const adminA = await prisma.user.create({
        data: {
            name: 'Admin PT Maju',
            email: 'admin@maju.com',
            password: 'password',
            role: 'ADMIN',
            companyId: companyA.id
        }
    });

    const adminB = await prisma.user.create({
        data: {
            name: 'Admin CV Sumber',
            email: 'admin@sumber.com',
            password: 'password',
            role: 'ADMIN',
            companyId: companyB.id
        }
    });
    console.log('✅ Users created');

    // 3. Seed Data for Company A (PT Maju)
    await seedCompanyData(companyA.id, 'PT Maju');

    // 4. Seed Data for Company B (CV Sumber)
    await seedCompanyData(companyB.id, 'CV Sumber');

    console.log('🌱 Seed completed successfully!');
}

async function seedCompanyData(companyId: string, prefix: string) {
    // COA
    const accounts = [
        { code: '4000', name: 'Pendapatan Penjualan', type: 'revenue', category: undefined },
        { code: '5000', name: 'Harga Pokok Penjualan (COGS)', type: 'expense', category: 'cogs' },
        { code: '6100', name: 'Biaya Transport', type: 'expense', category: 'transport' },
        { code: '6200', name: 'Biaya Tak Terduga', type: 'expense', category: 'unexpected' },
        { code: '6300', name: 'Biaya Lainnya', type: 'expense', category: 'other' },
    ];

    for (const acc of accounts) {
        await prisma.chartOfAccount.create({
            data: { ...acc, companyId }
        });
    }

    // Master Data
    const cust = await prisma.customer.create({
        data: {
            companyId,
            name: `${prefix} Customer 1`,
            contact: '08123456789',
            address: 'Jl. Test'
        }
    });

    const vendor = await prisma.vendor.create({
        data: {
            companyId,
            name: `${prefix} Vendor 1`,
            type: 'vendor',
            contact: 'Supplier X'
        }
    });

    const item = await prisma.item.create({
        data: {
            companyId,
            name: `${prefix} Item A`,
            unit: 'kg',
            category: 'General'
        }
    });

    // Transaction
    await prisma.transaction.create({
        data: {
            companyId,
            date: new Date(),
            type: 'sale',
            customerId: cust.id,
            itemId: item.id,
            quantity: 100,
            basePrice: 5000,
            sellPrice: 7000,
            revenue: 700000,
            cogs: 500000,
            totalExpenses: 0,
            margin: 200000,
            marginPercent: 28.5,
            notes: `First txn for ${prefix}`
        }
    });

    console.log(`✅ Seeded data for ${prefix}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
