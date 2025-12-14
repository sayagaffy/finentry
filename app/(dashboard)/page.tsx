import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ company?: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const params = await searchParams;
    const isOwner = session.user.role === 'OWNER';
    const companyParam = params.company;

    // Logic Konteks Perusahaan:
    // 1. Jika OWNER dan tidak ada ?company=ID -> Redirect ke Admin Overview (Pilih Perusahaan)
    if (isOwner && !companyParam) {
        redirect('/admin/overview');
    }

    // Tentukan perusahaan mana yang akan ditampilkan datanya
    let companyId: string | null = null;
    let companyName: string | null = null;

    if (isOwner && companyParam) {
        // OWNER dengan konteks perusahaan terpilih
        const company = await prisma.company.findUnique({
            where: { id: companyParam },
        });

        if (!company) {
            redirect('/admin/overview');
        }

        companyId = company.id;
        companyName = company.name;
    } else {
        // ADMIN biasa -> gunakan perusahaan mereka sendiri
        companyId = session.user.companyId;
        companyName = session.user.companyName;
    }

    // Fetch basic stats for the dashboard
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await prisma.transaction.findMany({
        where: {
            companyId: companyId!,
            deleted: false,
            date: {
                gte: firstDayThisMonth,
            },
        },
    });

    const revenue = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const profit = transactions.reduce((sum, t) => sum + t.margin, 0);
    const transactionCount = transactions.length;

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="space-y-6">
            {/* Company Context Indicator for OWNER */}
            {isOwner && companyName && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                {companyName[0]}
                            </div>
                            <div>
                                <p className="text-sm text-indigo-600 font-medium">Viewing Company</p>
                                <p className="text-lg font-bold text-indigo-900">{companyName}</p>
                            </div>
                        </div>
                        <a
                            href="/admin/overview"
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                            ← Back to Companies
                        </a>
                    </div>
                </div>
            )}

            {/* Dashboard Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">Overview of {companyName || 'your company'}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">Revenue (This Month)</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(revenue)}
                    </p>
                </div>
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">Profit (This Month)</p>
                    <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(profit)}
                    </p>
                </div>
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">{transactionCount}</p>
                </div>
            </div>

            {/* Placeholder for more dashboard content */}
            <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <p className="text-slate-500">Transaction history and charts will appear here...</p>
            </div>
        </div>
    );
}
