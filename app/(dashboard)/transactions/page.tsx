'use client';

import ImportModal from '@/components/shared/ImportModal';
import { apiClient } from '@/lib/apiClient';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Printer, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Types
interface Transaction {
    id: string;
    date: string;
    type: 'sale' | 'purchase';
    customer?: { name: string };
    vendor?: { name: string };
    item: { name: string; unit: string };
    quantity: number;
    sellPrice: number;
    revenue: number;
    totalExpenses: number;
    margin: number;
    marginPercent: number;
    invoiceNumber?: string | null;
}

interface MasterData {
    customers: any[];
    vendors: any[];
    items: any[];
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [masterData, setMasterData] = useState<MasterData>({ customers: [], vendors: [], items: [] });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0], // Last day of current month
        type: ''
    });

    const [showImport, setShowImport] = useState(false);

    // Form State
    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        type: 'sale',
        customerId: '',
        vendorId: '',
        itemId: '',
        quantity: 0,
        basePrice: 0,
        sellPrice: 0,
        transportCost: 0,
        unexpectedCost: 0,
        otherCost: 0,
        notes: ''
    };
    const [formData, setFormData] = useState(initialForm);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                startDate: filters.startDate,
                endDate: filters.endDate,
                ...(filters.type ? { type: filters.type } : {})
            }).toString();

            const data = await apiClient<Transaction[]>(`/transactions?${query}`);
            setTransactions(data);
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }

    async function fetchMasterData() {
        try {
            const [c, v, i] = await Promise.all([
                apiClient<any[]>('/customers'),
                apiClient<any[]>('/vendors'),
                apiClient<any[]>('/items')
            ]);
            setMasterData({ customers: c, vendors: v, items: i });
        } catch (error) {
            console.error("Failed to load master data", error);
        }
    }

    // Handle Edit Click
    function handleEdit(transaction: any) {
        setEditingId(transaction.id);
        const t = transaction;
        setFormData({
            date: t.date.split('T')[0],
            type: t.type,
            customerId: t.customerId || '',
            vendorId: t.vendorId || '',
            itemId: t.itemId,
            quantity: t.quantity,
            basePrice: t.basePrice,
            sellPrice: t.sellPrice,
            transportCost: t.transportCost,
            unexpectedCost: t.unexpectedCost,
            otherCost: t.otherCost,
            notes: t.notes || ''
        });
        setShowForm(true);
    }

    // Handle Delete Click
    async function handleDelete(id: string) {
        if (!confirm('Apakah anda yakin ingin menghapus transaksi ini?')) return;
        try {
            await apiClient(`/transactions/${id}`, { method: 'DELETE' });
            fetchData();
            toast.success('Transaksi dihapus');
        } catch (error) {
            toast.error('Gagal menghapus transaksi');
        }
    }

    function handleAddNew() {
        setEditingId(null);
        setFormData(initialForm);
        setShowForm(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.itemId || !formData.quantity) return toast.error("Item and Quantity are required");

        try {
            if (editingId) {
                // Update
                await apiClient(`/transactions/${editingId}`, { method: 'PUT', body: formData });
                toast.success('Transaksi diperbarui');
            } else {
                // Create
                await apiClient('/transactions', { method: 'POST', body: formData });
                toast.success('Transaksi berhasil dibuat');
            }
            setShowForm(false);
            setFormData(initialForm);
            setEditingId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save transaction');
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Transaksi</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImport(true)}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
                    >
                        <Upload className="h-4 w-4" /> Import Excel
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                    >
                        + Tambah Transaksi
                    </button>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="border rounded-md px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="border rounded-md px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipe</label>
                    <select
                        value={filters.type}
                        onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="border rounded-md px-3 py-2 text-sm min-w-[120px]"
                    >
                        <option value="">Semua</option>
                        <option value="sale">Penjualan</option>
                        <option value="purchase">Pembelian</option>
                    </select>
                </div>
                <button
                    onClick={fetchData}
                    className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-900"
                >
                    Filter
                </button>
            </div>

            {/* Transaction List */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b">
                            <tr>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">No. Invoice</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Pihak Terkait</th>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3 text-right">Vol</th>
                                <th className="px-4 py-3 text-right">Revenue</th>
                                <th className="px-4 py-3 text-right">Expenses</th>
                                <th className="px-4 py-3 text-right">Margin</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={9} className="p-4 text-center">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={9} className="p-4 text-center text-slate-500">Belum ada transaksi</td></tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">{format(new Date(t.date), 'dd MMM yyyy', { locale: id })}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {t.type === 'sale' ? 'Penjualan' : 'Pembelian'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{t.invoiceNumber || '-'}</td>
                                        <td className="px-4 py-3">{t.customer?.name || t.vendor?.name || '-'}</td>
                                        <td className="px-4 py-3">{t.item.name}</td>
                                        <td className="px-4 py-3 text-right">{t.quantity} {t.item.unit}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.revenue)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">({formatCurrency(t.totalExpenses)})</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(t.margin)} <span className="text-xs font-normal text-slate-500">({t.marginPercent.toFixed(1)}%)</span></td>
                                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                                            {t.type === 'sale' && (
                                                <button onClick={() => window.open(`/transactions/${t.id}/invoice`, '_blank')} title="Cetak Invoice" className="text-slate-600 hover:text-slate-800">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">Edit</button>
                                            <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 text-xs font-semibold">Hapus</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-over Form (Simple Overlay for MVP) */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
                    <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Transaksi' : 'Input Transaksi'}</h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-800">Tutup</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tanggal</label>
                                <input type="date" className="w-full border rounded p-2" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Jenis Transaksi</label>
                                <select className="w-full border rounded p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} required>
                                    <option value="sale">Penjualan</option>
                                    <option value="purchase">Pembelian</option>
                                </select>
                            </div>

                            {formData.type === 'sale' ? (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Customer</label>
                                    <select className="w-full border rounded p-2" value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} required>
                                        <option value="">Pilih Customer...</option>
                                        {masterData.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vendor/Suplier</label>
                                    <select className="w-full border rounded p-2" value={formData.vendorId} onChange={e => setFormData({ ...formData, vendorId: e.target.value })} required>
                                        <option value="">Pilih Vendor...</option>
                                        {masterData.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Item Barang</label>
                                <select className="w-full border rounded p-2" value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} required>
                                    <option value="">Pilih Item...</option>
                                    {masterData.items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Volume / Quantity</label>
                                    <input type="number" className="w-full border rounded p-2" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} required min="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Harga Dasar (COGS)</label>
                                    <input type="number" className="w-full border rounded p-2" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} required min="0" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Harga Jual (Revenue)</label>
                                <input type="number" className="w-full border rounded p-2" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: Number(e.target.value) })} required min="0" />
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-sm text-slate-500 mb-2">Biaya Tambahan (Expenses)</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Biaya Transport</label>
                                        <input type="number" className="w-full border rounded p-2 text-sm" value={formData.transportCost} onChange={e => setFormData({ ...formData, transportCost: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Biaya Tak Terduga</label>
                                        <input type="number" className="w-full border rounded p-2 text-sm" value={formData.unexpectedCost} onChange={e => setFormData({ ...formData, unexpectedCost: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Biaya Lainnya</label>
                                        <input type="number" className="w-full border rounded p-2 text-sm" value={formData.otherCost} onChange={e => setFormData({ ...formData, otherCost: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">Simpan Transaksi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ImportModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={() => { fetchData(); setShowImport(false); }}
                resource="transactions"
            />
        </div>
    );
}
