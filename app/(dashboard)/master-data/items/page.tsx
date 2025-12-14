'use client';

import { apiClient } from '@/lib/apiClient';
import { useEffect, useState } from 'react';

import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ImportModal from '@/components/shared/ImportModal';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ItemsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', unit: 'kg', category: '',
        defaultTaxType: 'NONE', requiresKtp: false,
        stockFull: 0, stockEmpty: 0
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await apiClient<any[]>('/items');
            setData(res);
        } catch (e) { toast.error('Failed to load items'); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `/items/${editingId}` : '/items';
            await apiClient(url, { method, body: formData });

            toast.success(editingId ? 'Item updated successfully' : 'Item created successfully');
            closeForm();
            loadData();
        } catch (error: any) { toast.error(error.message); }
    }

    function handleEdit(item: any) {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            unit: item.unit,
            category: item.category || '',
            defaultTaxType: item.defaultTaxType || 'NONE',
            requiresKtp: item.requiresKtp || false,
            stockFull: item.stockFull || 0,
            stockEmpty: item.stockEmpty || 0
        });
        setShowForm(true);
    }

    // ... (handleDelete and confirmDelete omitted for brevity if unchanged) ... 

    function handleDelete(id: string) {
        setDeleteId(id);
    }

    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await apiClient(`/items/${deleteId}`, { method: 'DELETE' });
            toast.success('Item deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete item');
        } finally {
            setDeleteId(null);
        }
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            name: '', unit: 'kg', category: '',
            defaultTaxType: 'NONE', requiresKtp: false,
            stockFull: 0, stockEmpty: 0
        });
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Items / Goods</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImport(true)}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
                    >
                        <Upload className="h-4 w-4" /> Import
                    </button>
                    <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium text-sm">+ New Item</button>
                </div>
            </div>

            <div className="bg-white border rounded shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Stock (Isi | Kosong)</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                            data.map(d => (
                                <tr key={d.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium">{d.name}</td>
                                    <td className="px-4 py-2 text-slate-500">{d.unit}</td>
                                    <td className="px-4 py-2">{d.category || '-'}</td>
                                    <td className="px-4 py-2 text-right font-mono text-xs">
                                        <span className="text-green-600 font-bold">{d.stockFull}</span>
                                        <span className="text-slate-300 mx-2">|</span>
                                        <span className="text-orange-600 font-bold">{d.stockEmpty}</span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(d)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                            <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Item' : 'Add Item'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input placeholder="Item Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <select className="w-full border p-2 rounded" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} required>
                                <option value="kg">Kilogram (kg)</option>
                                <option value="ton">Ton</option>
                                <option value="unit">Unit/Pcs</option>
                                <option value="liter">Liter</option>
                            </select>
                            <input placeholder="Category (e.g. Sembako)" className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />

                            {/* LPG Specifics */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Default Tax Type</label>
                                <select className="w-full border p-2 rounded" value={formData.defaultTaxType} onChange={e => setFormData({ ...formData, defaultTaxType: e.target.value })}>
                                    <option value="NONE">None / Bebas Pajak</option>
                                    <option value="VAT_11">PPN Standard (11%)</option>
                                    <option value="LPG_PMK62">PPN Agen LPG (PMK 62)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="requiresKtp" checked={formData.requiresKtp} onChange={e => setFormData({ ...formData, requiresKtp: e.target.checked })} />
                                <label htmlFor="requiresKtp" className="text-sm">Requires KTP (Subsidized)</label>
                            </div>

                            {/* Inventory Initial Stock (Stok Awal) */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Stock Full (Isi)</label>
                                    <input type="number" className="w-full border p-2 rounded text-right" value={formData.stockFull} onChange={e => setFormData({ ...formData, stockFull: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Stock Empty (Kosong)</label>
                                    <input type="number" className="w-full border p-2 rounded text-right" value={formData.stockEmpty} onChange={e => setFormData({ ...formData, stockEmpty: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ImportModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={() => { loadData(); setShowImport(false); }}
                resource="items"
            />

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
}
