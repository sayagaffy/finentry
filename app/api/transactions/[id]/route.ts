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

        // Taxation Refinement (PMK 62 / Standard)
        let ppnAmount = 0;
        const taxType = body.taxType || existing.taxType || "NONE";

        if (taxType === "VAT_11") {
            ppnAmount = revenue * 0.11;
        } else if (taxType === "LPG_PMK62") {
            if (margin > 0) {
                ppnAmount = margin * (1.1 / 101.1);
            }
        }
        ppnAmount = Math.round(ppnAmount);

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
                marginPercent,
                // Taxation & LPG fields
                taxType: body.taxType || undefined,
                ppnAmount: ppnAmount,
                emptiesReturned: Number(body.emptiesReturned) || 0
            },
            include: { customer: true, vendor: true, item: true }
        });

        // Update Stock
        await updateStockOnEdit(existing, updated);

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Transaction Error:", error);
        return NextResponse.json({ error: 'Failed to update transaction', details: String(error) }, { status: 500 });
    }
}

async function updateStockOnEdit(oldTx: any, newTx: any) {
    // 1. Revert Old (Balikkan efek transaksi lama)
    if (oldTx.type === 'sale') {
        await prisma.item.update({
            where: { id: oldTx.itemId },
            data: {
                stockFull: { increment: oldTx.quantity }, // Kembalikan stok penuh
                stockEmpty: { decrement: oldTx.emptiesReturned || 0 } // Kembalikan stok kosong
            }
        });
    } else if (oldTx.type === 'purchase') {
        await prisma.item.update({
            where: { id: oldTx.itemId },
            data: {
                stockFull: { decrement: oldTx.quantity },
                stockEmpty: { increment: oldTx.quantity }
            }
        });
    }

    // 2. Apply New (Terapkan efek transaksi baru)
    if (newTx.type === 'sale') {
        await prisma.item.update({
            where: { id: newTx.itemId },
            data: {
                stockFull: { decrement: newTx.quantity },
                stockEmpty: { increment: newTx.emptiesReturned || 0 }
            }
        });
    } else if (newTx.type === 'purchase') {
        await prisma.item.update({
            where: { id: newTx.itemId },
            data: {
                stockFull: { increment: newTx.quantity },
                stockEmpty: { decrement: newTx.quantity }
            }
        });
    }
}
