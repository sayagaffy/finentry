import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userCompanyId = session.user.companyId;
        const isOwner = session.user.role === 'OWNER';

        if (!userCompanyId && !isOwner) {
            return NextResponse.json({ error: 'Unauthorized: No Company' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type');
        const customerId = searchParams.get('customerId');

        const whereClause: any = { deleted: false };
        if (userCompanyId) whereClause.companyId = userCompanyId;

        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (type) {
            whereClause.type = type;
        }

        if (customerId) {
            whereClause.customerId = customerId;
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                customer: true,
                vendor: true,
                item: true,
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userCompanyId = session.user.companyId;

        const body = await request.json();
        const {
            date,
            type,
            customerId,
            vendorId,
            itemId,
            quantity,
            basePrice,
            sellPrice,
            transportCost = 0,
            unexpectedCost = 0,
            otherCost = 0,
            notes,
        } = body;

        // Basic Validation
        if (!date || !type || !itemId || !quantity || !basePrice || !sellPrice) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Auto-calculation
        const revenue = Number(quantity) * Number(sellPrice);
        const cogs = Number(quantity) * Number(basePrice);
        const totalExpenses = Number(transportCost) + Number(unexpectedCost) + Number(otherCost);
        const margin = revenue - cogs - totalExpenses;
        const marginPercent = revenue !== 0 ? (margin / revenue) * 100 : 0;

        let invoiceNumber: string | null = null;
        if (type === 'sale') {
            const dateObj = new Date(date);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0);

            const count = await prisma.transaction.count({
                where: {
                    companyId: userCompanyId,
                    type: 'sale',
                    date: { gte: startOfMonth, lte: endOfMonth },
                    deleted: false
                }
            });

            const sequence = (count + 1).toString().padStart(3, '0');
            const monthStr = month.toString().padStart(2, '0');
            invoiceNumber = `INV/${year}/${monthStr}/${sequence}`;
        }

        const transaction = await prisma.transaction.create({
            data: {
                companyId: userCompanyId,
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
                // Calculated fields
                revenue,
                cogs,
                totalExpenses,
                margin,
                marginPercent,
                invoiceNumber
            },
            include: {
                customer: true,
                vendor: true,
                item: true,
            }
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error: any) {
        console.error("Transaction Create Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to create transaction' }, { status: 500 });
    }
}
