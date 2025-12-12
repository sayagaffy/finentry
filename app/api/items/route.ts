import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const where: any = {};
        if (session.user.companyId) where.companyId = session.user.companyId;

        const items = await prisma.item.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(items);
    } catch (error) {
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

            const validItems = body
                .filter((i: any) => i.name && i.unit && !existingNames.has(i.name.toLowerCase()))
                .map((i: any) => ({
                    companyId: session.user.companyId!,
                    name: i.name,
                    unit: i.unit,
                    category: i.category || null,
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
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
