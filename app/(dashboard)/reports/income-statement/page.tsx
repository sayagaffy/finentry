'use client';

import { apiClient } from '@/lib/apiClient';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const [dateRange, setDateRange] = useState({
        startDate: startOfMonth(new Date()).toISOString().split('T')[0],
        endDate: endOfMonth(new Date()).toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReport();
    }, []); // eslint-disable-line

    async function fetchReport() {
        setLoading(true);
        try {
            const report = await apiClient(`/reports/income-statement?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            setData(report);
        } catch (error) {
            alert('Failed to load report');
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h1>
                <div className="flex gap-2 items-center bg-white p-2 rounded border print:hidden">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="border p-1 rounded text-sm"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="border p-1 rounded text-sm"
                    />
                    <button
                        onClick={fetchReport}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                    >
                        Filter
                    </button>
                </div>
                <div className="hidden print:block text-sm text-slate-500">
                    Dicetak pada: {new Date().toLocaleDateString('id-ID')}
                </div>
                <button
                    onClick={() => window.print()}
                    className="ml-2 bg-white border border-slate-300 text-slate-700 p-2 rounded hover:bg-slate-50 print:hidden"
                    title="Cetak Laporan"
                >
                    <Printer className="w-4 h-4" />
                </button>
            </div>

            {loading && <div className="text-center py-10">Loading Report...</div>}

            {!loading && data && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <div className="text-sm text-slate-500 font-medium uppercase">Total Revenue</div>
                            <div className="text-3xl font-bold text-indigo-600 mt-2">{formatCurrency(data.totalRevenue)}</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <div className="text-sm text-slate-500 font-medium uppercase">Total Biaya (COGS + Exp)</div>
                            <div className="text-3xl font-bold text-slate-700 mt-2">{formatCurrency(data.totalCOGS + data.expenses.total)}</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <div className="text-sm text-slate-500 font-medium uppercase">Laba Bersih (Net Profit)</div>
                            <div className={`text-3xl font-bold mt-2 ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(data.netProfit)}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Margin: {((data.netProfit / data.totalRevenue) * 100 || 0).toFixed(1)}%</div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b font-medium text-slate-700">Detail Laporan</div>
                        <div className="p-6">
                            <table className="w-full">
                                <tbody>
                                    {/* Revenue */}
                                    <tr>
                                        <td className="py-2 text-slate-600">Pendapatan Penjualan</td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(data.totalRevenue)}</td>
                                    </tr>
                                    <tr className="border-b"><td className="pb-4"></td><td className="pb-4"></td></tr>

                                    {/* COGS */}
                                    <tr>
                                        <td className="py-2 pt-4 text-slate-600">Harga Pokok Penjualan (COGS)</td>
                                        <td className="py-2 pt-4 text-right text-red-500">({formatCurrency(data.totalCOGS)})</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="py-2 px-2 font-bold text-slate-800">LABA KOTOR (Gross Profit)</td>
                                        <td className="py-2 px-2 text-right font-bold text-slate-800">{formatCurrency(data.grossProfit)}</td>
                                    </tr>

                                    {/* Expenses */}
                                    <tr>
                                        <td className="py-2 pt-4 pl-4 text-slate-600">Biaya Transport</td>
                                        <td className="py-2 pt-4 text-right text-slate-500">{formatCurrency(data.expenses.transport)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4 text-slate-600">Biaya Tak Terduga</td>
                                        <td className="py-2 text-right text-slate-500">{formatCurrency(data.expenses.unexpected)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pl-4 text-slate-600">Biaya Lainnya</td>
                                        <td className="py-2 text-right text-slate-500">{formatCurrency(data.expenses.other)}</td>
                                    </tr>
                                    <tr className="border-t border-dashed">
                                        <td className="py-2 font-medium text-slate-700">Total Biaya Operasional</td>
                                        <td className="py-2 text-right font-medium text-red-500">({formatCurrency(data.expenses.total)})</td>
                                    </tr>

                                    {/* Net Profit */}
                                    <tr className="border-t-2 border-slate-200">
                                        <td className="py-4 text-xl font-bold text-slate-900">LABA BERSIH TAHUN BERJALAN</td>
                                        <td className="py-4 text-xl font-bold text-right text-green-600">{formatCurrency(data.netProfit)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
