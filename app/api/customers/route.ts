import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Mengambil daftar customer
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const where: any = {};
        // Jika user terikat perusahaan, filter berdasarkan companyId
        if (session.user.companyId) where.companyId = session.user.companyId;
        // Jika Owner (tanpa companyId), ambil semua (atau logic lain sesuai kebutuhan)

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Handle Bulk Create (Banyak Data Sekaligus)
        // Biasanya dipanggil dari fitur Import Excel
        if (Array.isArray(body)) {
            // Cek nama customer yang sudah ada agar tidak duplikat
            const existing = await prisma.customer.findMany({
                where: { companyId: session.user.companyId },
                select: { name: true },
            });
            const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

            // Filter hanya customer baru (belum ada namanya di database)
            const validCustomers = body
                .filter((c: any) => c.name && !existingNames.has(c.name.toLowerCase()))
                .map((c: any) => ({
                    companyId: session.user.companyId!,
                    name: c.name,
                    contact: c.contact || null,
                    address: c.address || null,
                    identityNumber: c.identityNumber || null,
                }));

            if (validCustomers.length > 0) {
                const result = await prisma.customer.createMany({
                    data: validCustomers,
                });
                return NextResponse.json({ count: result.count, skipped: body.length - validCustomers.length }, { status: 201 });
            }
            return NextResponse.json({ count: 0, skipped: body.length }, { status: 201 });
        }

        // Handle Single Create (Satu Data)
        const { name, contact, address } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const customer = await prisma.customer.create({
            data: {
                companyId: session.user.companyId,
                name,
                contact,
                address,
                identityNumber: body.identityNumber || null,
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}
