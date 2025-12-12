import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;

        // Verify ownership (or Owner role)
        const existing = await prisma.transaction.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (session.user.companyId && existing.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Soft Delete
        await prisma.transaction.update({
            where: { id },
            data: { deleted: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Transaction Error:", error);
        return NextResponse.json({ error: 'Failed to delete transaction', details: String(error) }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;

        // Verify ownership
        const existing = await prisma.transaction.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (session.user.companyId && existing.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const {
            date, type, customerId, vendorId, itemId, quantity,
            basePrice, sellPrice, transportCost, unexpectedCost, otherCost, notes
        } = body;

        // Auto-calculation
        const revenue = Number(quantity) * Number(sellPrice);
        const cogs = Number(quantity) * Number(basePrice);
        const totalExpenses = Number(transportCost) + Number(unexpectedCost) + Number(otherCost);
        const margin = revenue - cogs - totalExpenses;
        const marginPercent = revenue !== 0 ? (margin / revenue) * 100 : 0;

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                date: new Date(date),
                type,
                customerId: customerId || null,
                vendorId: vendorId || null,
                itemId,
                quantity: Number(quantity),
                basePrice: Number(basePrice),
                sellPrice: Number(sellPrice),
                transportCost: Number(transportCost),
                unexpectedCost: Number(unexpectedCost),
                otherCost: Number(otherCost),
                notes,
                revenue,
                cogs,
                totalExpenses,
                margin,
                marginPercent
            },
            include: { customer: true, vendor: true, item: true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Transaction Error:", error);
        return NextResponse.json({ error: 'Failed to update transaction', details: String(error) }, { status: 500 });
    }
}
