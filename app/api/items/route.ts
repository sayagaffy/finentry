import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const where: any = {};
        if (session.user.companyId) where.companyId = session.user.companyId;
        where.deleted = false;

        const items = await prisma.item.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("Fetch Items Error:", error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Handle Bulk Create
        if (Array.isArray(body)) {
            const existing = await prisma.item.findMany({
                where: { companyId: session.user.companyId },
                select: { name: true },
            });
            const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

            // Mapping data body ke format database
            const validItems = body
                .filter((i: any) => i.name && i.unit && !existingNames.has(i.name.toLowerCase()))
                .map((i: any) => ({
                    companyId: session.user.companyId!,
                    name: i.name,
                    unit: i.unit,
                    category: i.category || null,
                    defaultTaxType: i.defaultTaxType || "NONE",
                    requiresKtp: i.requiresKtp || false,
                    // Field khusus LPG: Stok penuh vs Stok kosong (Tabung)
                    stockFull: Number(i.stockFull) || 0,
                    stockEmpty: Number(i.stockEmpty) || 0
                }));

            if (validItems.length > 0) {
                const result = await prisma.item.createMany({
                    data: validItems,
                });
                return NextResponse.json({ count: result.count, skipped: body.length - validItems.length }, { status: 201 });
            }
            return NextResponse.json({ count: 0, skipped: body.length }, { status: 201 });
        }

        // Handle Single Create
        const { name, unit, category } = body;

        if (!name || !unit) {
            return NextResponse.json({ error: 'Name and Unit are required' }, { status: 400 });
        }

        const item = await prisma.item.create({
            data: {
                company: { connect: { id: session.user.companyId } },
                name,
                unit,
                category,
                // LPG Specifics
                defaultTaxType: body.defaultTaxType || "NONE",
                requiresKtp: body.requiresKtp || false,
                // Inventory
                stockFull: Number(body.stockFull) || 0,
                stockEmpty: Number(body.stockEmpty) || 0
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
