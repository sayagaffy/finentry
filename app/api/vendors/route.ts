import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const where: any = {};
        if (session.user.companyId) where.companyId = session.user.companyId;

        const vendors = await prisma.vendor.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(vendors);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Handle Bulk Create
        if (Array.isArray(body)) {
            const existing = await prisma.vendor.findMany({
                where: { companyId: session.user.companyId },
                select: { name: true },
            });
            const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

            const validVendors = body
                .filter((v: any) => v.name && v.type && !existingNames.has(v.name.toLowerCase()))
                .map((v: any) => ({
                    companyId: session.user.companyId!,
                    name: v.name,
                    type: v.type, // 'vendor' or 'transporter', assumed validated by frontend or just string
                    contact: v.contact || null,
                }));

            if (validVendors.length > 0) {
                const result = await prisma.vendor.createMany({
                    data: validVendors,
                });
                return NextResponse.json({ count: result.count, skipped: body.length - validVendors.length }, { status: 201 });
            }
            return NextResponse.json({ count: 0, skipped: body.length }, { status: 201 });
        }

        // Handle Single Create
        const { name, type, contact } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 });
        }

        const vendor = await prisma.vendor.create({
            data: {
                companyId: session.user.companyId,
                name,
                type,
                contact,
            },
        });

        return NextResponse.json(vendor, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }
}
