'use client';

import { apiClient } from '@/lib/apiClient';
import { Building2, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CompanyStats {
    companyId: string;
    companyName: string;
    revenue: number;
    profit: number;
    margin: number;
    transactionCount: number;
    trend: 'up' | 'down' | 'flat';
    growth: number;
}

export default function CompanyOverviewPage() {
    const [companies, setCompanies] = useState<CompanyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        try {
            const data = await apiClient<CompanyStats[]>('/admin/overview');
            setCompanies(data);
        } catch (error) {
            console.error('Failed to load companies:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    }

    function getTrendConfig(trend: 'up' | 'down' | 'flat') {
        switch (trend) {
            case 'up':
                return {
                    icon: TrendingUp,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    label: 'Growing',
                };
            case 'down':
                return {
                    icon: TrendingDown,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    label: 'Declining',
                };
            default:
                return {
                    icon: TrendingUp,
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    label: 'Stable',
                };
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Loading companies...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Company Overview</h1>
                <p className="text-slate-600 mt-1">Monitor performance across all companies</p>
            </div>

            {companies.length === 0 ? (
                <div className="bg-white border rounded-lg p-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Companies Yet</h3>
                    <p className="text-slate-600 mb-4">Create your first company to get started</p>
                    <Link href="/admin/companies">
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                            Manage Companies
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {companies.map((company) => {
                        const trendConfig = getTrendConfig(company.trend);
                        const TrendIcon = trendConfig.icon;

                        return (
                            <div
                                key={company.companyId}
                                className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                                            {company.companyName}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {company.transactionCount} transactions this month
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trendConfig.bg}`}>
                                        <TrendIcon className={`h-4 w-4 ${trendConfig.color}`} />
                                        <span className={`text-sm font-semibold ${trendConfig.color}`}>
                                            {company.growth > 0 ? '+' : ''}{company.growth.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Revenue</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency(company.revenue)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Profit</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency(company.profit)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Margin</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {company.margin.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        <p className={`text-sm font-semibold ${trendConfig.color}`}>
                                            {trendConfig.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link href={`/?company=${company.companyId}`}>
                                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors">
                                        View Details →
                                    </button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
