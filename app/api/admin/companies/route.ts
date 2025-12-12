import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const companies = await prisma.company.findMany({
            include: { _count: { select: { users: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(companies);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await request.json();
        const { name, plan, adminName, adminEmail, adminPassword } = body;

        // Transaction to create Company + Admin User
        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    subscriptionPlan: plan || 'basic'
                }
            });

            const user = await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: adminPassword, // Plain text for MVP as discussed
                    role: 'ADMIN',
                    companyId: company.id
                }
            });

            // Seed basic COA for new company
            const accounts = [
                { code: '4000', name: 'Pendapatan Penjualan', type: 'revenue' },
                { code: '5000', name: 'Harga Pokok Penjualan (COGS)', type: 'expense', category: 'cogs' },
                { code: '6000', name: 'Biaya Operasional', type: 'expense', category: 'other' },
            ];

            for (const acc of accounts) {
                await tx.chartOfAccount.create({
                    data: { ...acc, companyId: company.id }
                });
            }

            return { company, user };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }
}
