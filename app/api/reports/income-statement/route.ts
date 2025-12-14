import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userCompanyId = session.user.companyId;
        const isOwner = session.user.role === 'OWNER';

        // Allow if has CompanyId OR is Owner
        if (!userCompanyId && !isOwner) {
            return NextResponse.json({ error: 'Unauthorized: No Company' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
        }

        const whereClause: any = {
            date: { gte: new Date(startDate), lte: new Date(endDate) },
            deleted: false
        };
        // Owner fetches ALL if no companyId filter added (Global view). Admin fetches only their company.
        if (userCompanyId) whereClause.companyId = userCompanyId;

        // Agregasi Data: Menjumlahkan revenue, HPP (COGS), dan biaya-biaya
        const aggregations = await prisma.transaction.aggregate({
            where: whereClause,
            _sum: {
                revenue: true,
                cogs: true,
                transportCost: true,
                unexpectedCost: true,
                otherCost: true,
                margin: true,
            },
            _count: true,
        });

        const report = {
            period: { startDate, endDate },
            totalRevenue: aggregations._sum.revenue || 0,
            totalCOGS: aggregations._sum.cogs || 0,
            grossProfit: (aggregations._sum.revenue || 0) - (aggregations._sum.cogs || 0),
            expenses: {
                transport: aggregations._sum.transportCost || 0,
                unexpected: aggregations._sum.unexpectedCost || 0,
                other: aggregations._sum.otherCost || 0,
                total: (aggregations._sum.transportCost || 0) + (aggregations._sum.unexpectedCost || 0) + (aggregations._sum.otherCost || 0),
            },
            netProfit: aggregations._sum.margin || 0,
            transactionCount: aggregations._count,
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
