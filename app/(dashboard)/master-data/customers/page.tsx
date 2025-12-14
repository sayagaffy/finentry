'use client';

import { apiClient } from '@/lib/apiClient';
import { useEffect, useState } from 'react';

import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ImportModal from '@/components/shared/ImportModal';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomersPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', contact: '', address: '', identityNumber: '' });

    useEffect(() => { loadData(); }, []);

    // ... (loadData omitted) ...

    async function loadData() {
        setLoading(true);
        try {
            const res = await apiClient<any[]>('/customers');
            setData(res);
        } catch (e) { toast.error('Failed to load customers'); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            // Tentukan method: POST (Buat Baru) atau PUT (Update)
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `/customers/${editingId}` : '/customers';
            await apiClient(url, { method, body: formData });

            toast.success(editingId ? 'Customer updated successfully' : 'Customer created successfully');
            closeForm();
            loadData();
        } catch (error: any) { toast.error(error.message); }
    }

    function handleEdit(customer: any) {
        setEditingId(customer.id);
        setFormData({
            name: customer.name,
            contact: customer.contact || '',
            address: customer.address || '',
            identityNumber: customer.identityNumber || ''
        });
        setShowForm(true);
    }

    function handleDelete(id: string) {
        setDeleteId(id);
    }

    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await apiClient(`/customers/${deleteId}`, { method: 'DELETE' });
            toast.success('Customer deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete customer');
        } finally {
            setDeleteId(null);
        }
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', contact: '', address: '', identityNumber: '' });
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Customers</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImport(true)}
                        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded flex items-center gap-2 text-sm font-medium"
                    >
                        <Upload className="h-4 w-4" /> Import
                    </button>
                    <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium text-sm">+ New Customer</button>
                </div>
            </div>

            <div className="bg-white border rounded shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Address</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                            data.map(d => (
                                <tr key={d.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium">{d.name}</td>
                                    <td className="px-4 py-2">{d.contact || '-'}</td>
                                    <td className="px-4 py-2">{d.address || '-'}</td>
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
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input placeholder="Name" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <input placeholder="Contact (Phone/Email)" className="w-full border p-2 rounded" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                            <input placeholder="NIK / KTP (Required for Gas 3kg)" className="w-full border p-2 rounded" value={formData.identityNumber} onChange={e => setFormData({ ...formData, identityNumber: e.target.value })} />
                            <textarea placeholder="Address" className="w-full border p-2 rounded" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
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
                resource="customers"
            />

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
}
