import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Mengambil daftar perusahaan (Hanya untuk OWNER)
export async function GET() {
    try {
        const session = await auth();
        // Cek otorisasi: hanya OWNER yang boleh akses
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

        // Transaction: Membuat Perusahaan + User Admin + Chart of Accounts (COA) dasar
        // Menggunakan transaction database agar jika satu gagal, semua dibatalkan (atomic)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Buat Perusahaan
            const company = await tx.company.create({
                data: {
                    name,
                    subscriptionPlan: plan || 'basic'
                }
            });

            // 2. Buat User Admin untuk perusahaan tersebut
            const user = await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: adminPassword, // Password plain text (sementara untuk MVP)
                    role: 'ADMIN',
                    companyId: company.id
                }
            });

            // 3. Seed Basic COA (Chart of Accounts) untuk perusahaan baru
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
