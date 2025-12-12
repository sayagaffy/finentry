import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();

        // Only OWNER can access this endpoint
        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all companies
        const companies = await prisma.company.findMany({
            orderBy: { name: 'asc' },
        });

        // Calculate stats for each company
        const companiesWithStats = await Promise.all(
            companies.map(async (company) => {
                // Get current month and last month date ranges
                const now = new Date();
                const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

                // Fetch transactions for this month
                const thisMonthTransactions = await prisma.transaction.findMany({
                    where: {
                        companyId: company.id,
                        deleted: false,
                        date: {
                            gte: firstDayThisMonth,
                        },
                    },
                });

                // Fetch transactions for last month
                const lastMonthTransactions = await prisma.transaction.findMany({
                    where: {
                        companyId: company.id,
                        deleted: false,
                        date: {
                            gte: firstDayLastMonth,
                            lte: lastDayLastMonth,
                        },
                    },
                });

                // Calculate this month metrics
                const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + t.revenue, 0);
                const thisMonthProfit = thisMonthTransactions.reduce((sum, t) => sum + t.margin, 0);
                const thisMonthMargin = thisMonthRevenue > 0 ? (thisMonthProfit / thisMonthRevenue) * 100 : 0;

                // Calculate last month revenue for growth comparison
                const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + t.revenue, 0);

                // Calculate growth percentage
                let growth = 0;
                if (lastMonthRevenue > 0) {
                    growth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
                } else if (thisMonthRevenue > 0) {
                    growth = 100; // First month with revenue
                }

                // Determine trend
                let trend: 'up' | 'down' | 'flat' = 'flat';
                if (growth > 5) trend = 'up';
                else if (growth < -5) trend = 'down';

                return {
                    companyId: company.id,
                    companyName: company.name,
                    revenue: thisMonthRevenue,
                    profit: thisMonthProfit,
                    margin: Math.round(thisMonthMargin * 100) / 100, // Round to 2 decimals
                    transactionCount: thisMonthTransactions.length,
                    trend,
                    growth: Math.round(growth * 100) / 100, // Round to 2 decimals
                };
            })
        );

        return NextResponse.json(companiesWithStats);
    } catch (error) {
        console.error('Error fetching company overview:', error);
        return NextResponse.json({ error: 'Failed to fetch company overview' }, { status: 500 });
    }
}
