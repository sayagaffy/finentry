
import { auth } from '@/auth';
import { generateAIResponse } from '@/lib/aiHelper';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let userCompanyId = session.user.companyId;
        const isOwner = session.user.role === 'OWNER';

        if (!userCompanyId && !isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fallback untuk OWNER jika tidak ada companyId spesifik: Gunakan Perusahaan Pertama
        if (!userCompanyId && isOwner) {
            const firstCompany = await prisma.company.findFirst();
            userCompanyId = firstCompany?.id || null;
        }

        // 1. Fetch AI Configuration
        const aiModel = (prisma as any).aIConfig || (prisma as any).aiConfig;
        const aiConfig = await aiModel.findUnique({
            // Should now strictly be a valid companyId, or throw if none exists (which is fair)
            where: { companyId: userCompanyId }
        });

        if (!aiConfig?.isActive || !aiConfig.apiKey) {
            return NextResponse.json({
                answer: "AI Assistant is not configured. Please go to Settings > AI to set up your provider (Groq/Gemini/OpenAI).",
                isConfigMissing: true
            });
        }

        const { query, dateRange } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Default to current month if not specified
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : startOfMonth;
        const endDate = dateRange?.endDate ? new Date(dateRange.endDate) : endOfMonth;

        // 2. Fetch Data (Single Company or Multi-Company for Owner)
        let contextData: any = {};

        // Jika Owner dan TIDAK memilih perusahaan tertentu (Global View), ambil data perbandingan semua perusahaan
        if (isOwner && !session.user.companyId) {
            const allCompanies = await prisma.company.findMany({
                include: {
                    transactions: {
                        where: {
                            date: { gte: startDate, lte: endDate },
                            deleted: false
                        }
                    }
                }
            });

            // Hitung ringkasan performa tiap perusahaan
            const companyComparisons = allCompanies.map(c => {
                const revenue = c.transactions.reduce((sum, t) => sum + t.revenue, 0);
                const expenses = c.transactions.reduce((sum, t) => sum + t.totalExpenses, 0);
                const cogs = c.transactions.reduce((sum, t) => sum + t.cogs, 0);
                const margin = revenue - cogs - expenses;

                return {
                    name: c.name,
                    revenue,
                    profit: margin,
                    margin_percent: revenue > 0 ? (margin / revenue) * 100 : 0
                };
            });

            contextData = {
                scope: "MULTI_COMPANY",
                period: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] },
                summary: companyComparisons
            };

        } else {
            // Flow untuk Single Company (Admin atau Owner di dalam perusahaan)
            const whereClause: any = {
                date: { gte: startDate, lte: endDate },
                deleted: false,
                companyId: userCompanyId
            };

            const [stats, expenseBreakdown, topCustomers] = await Promise.all([
                // Aggregate Statistik Utama
                prisma.transaction.aggregate({
                    where: whereClause,
                    _sum: { revenue: true, cogs: true, totalExpenses: true, margin: true },
                    _count: true
                }),
                // Breakdown Pengeluaran per Kategori
                (prisma as any).transaction.groupBy({
                    by: ['category'],
                    where: { ...whereClause, type: 'expense' },
                    _sum: { totalExpenses: true },
                    orderBy: { _sum: { totalExpenses: 'desc' } }
                }),
                // Top 5 Customer berdasarkan Revenue
                (prisma as any).transaction.groupBy({
                    by: ['customerId'],
                    where: { ...whereClause, type: 'sale' },
                    _sum: { revenue: true },
                    orderBy: { _sum: { revenue: 'desc' } },
                    take: 5
                }).then(async (groups: any[]) => {
                    return await Promise.all(groups.map(async (g) => {
                        if (!g.customerId) return { name: 'Unknown', revenue: g._sum.revenue };
                        const c = await prisma.customer.findUnique({ where: { id: g.customerId } });
                        return { name: c?.name || 'Unknown', revenue: g._sum.revenue };
                    }));
                })
            ]);

            contextData = {
                scope: "SINGLE_COMPANY",
                company: session.user.name,
                period: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] },
                financials: {
                    revenue: stats._sum.revenue || 0,
                    cogs: stats._sum.cogs || 0,
                    expenses: stats._sum.totalExpenses || 0,
                    net_profit: stats._sum.margin || 0,
                    transaction_count: stats._count
                },
                expense_breakdown: expenseBreakdown.map((e: any) => ({ category: e.category || 'Uncategorized', amount: e._sum.totalExpenses || 0 })),
                top_customers: topCustomers
            };
        }

        // 3. Generate AI Response
        const systemPrompt = `
        You are a smart Financial Assistant for ${contextData.company}.
        Current Date: ${now.toISOString().split('T')[0]}
        
        Strictly answer based on the provided CONTEXT only.

        APPLICATION CONTEXT:
        AppName: Finentry by Priventry
        Purpose: A comprehensive financial management dashboard for businesses.
        Key Features:
        - Dashboard: Overview of financial health (Revenue, Expenses, Profit).
        - Transactions: Record and manage income and expenses. Supports Excel import.
        - Reports: View profit & loss statements.
        - Analytics: Visual trends of revenue and expenses.
        - Customer & Vendor Management: Track people you do business with.
        
        FINANCIAL CONTEXT:
        ${JSON.stringify(contextData, null, 2)}
        
        Guidelines:
        - Use Indonesian language.
        - Be professional, data-driven, and helpful.
        - Format currency in IDR (Rp).
        - ALLOWED TOPICS:
          1. Questions about the specific financial data provided above.
          2. Questions about the Finentry by Priventry application itself (what it is, how to use features, where to find things).
          3. Definitions of financial terms found in the app (e.g., "What is COGS?", "What is Margin?").
        - REFUSAL: If the user asks about general knowledge UNRELATED to finance or the app (e.g. "Who is president?", "Recipe for cake"), politely refuse: "Saya hanya dapat menjawab pertanyaan seputar data keuangan Anda dan aplikasi Finentry by Priventry."
        - If data is missing for a specific data question, say "Data tidak tersedia."
        `;

        const response = await generateAIResponse({
            provider: aiConfig.provider,
            apiKey: aiConfig.apiKey,
            model: aiConfig.model,
            systemPrompt,
            userPrompt: query
        });

        return NextResponse.json({ answer: response.answer, context: contextData });

    } catch (error: any) {
        console.error("AI Route Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
