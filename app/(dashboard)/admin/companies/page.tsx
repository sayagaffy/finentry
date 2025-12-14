'use client';

import { apiClient } from '@/lib/apiClient';
import { useEffect, useState } from 'react';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', plan: 'basic',
        adminName: '', adminEmail: '', adminPassword: ''
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Fetch daftar perusahaan (Hanya untuk OWNER)
            const res = await apiClient<any[]>('/admin/companies');
            setCompanies(res);
        } catch (e) {
            // Error 403 jika bukan owner
            console.error(e);
        }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await apiClient('/admin/companies', { method: 'POST', body: formData });
            setShowForm(false);
            setFormData({ name: '', plan: 'basic', adminName: '', adminEmail: '', adminPassword: '' });
            loadData();
        } catch (error: any) { alert(error.message); }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Company Setup</h1>
                    <p className="text-slate-500">Manage Tenants (PT) and Admins</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded">+ New Company</button>
            </div>

            <div className="bg-white border rounded shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Company Name</th>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3">Users</th>
                            <th className="px-4 py-3">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                            companies.map(d => (
                                <tr key={d.id} className="border-b hover:bg-slate-50">
                                    <td className="px-4 py-2 font-medium">{d.name}</td>
                                    <td className="px-4 py-2 uppercase text-xs font-bold text-slate-500">{d.subscriptionPlan}</td>
                                    <td className="px-4 py-2">{d._count?.users || 0}</td>
                                    <td className="px-4 py-2 text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Register New Company (PT)</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="font-semibold text-sm mb-2 text-indigo-600">Company Details</p>
                            </div>
                            <input placeholder="Company Name (PT ...)" className="border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <select className="border p-2 rounded" value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })}>
                                <option value="basic">Basic Plan</option>
                                <option value="pro">Pro Plan</option>
                                <option value="enterprise">Enterprise</option>
                            </select>

                            <div className="col-span-2 mt-2">
                                <p className="font-semibold text-sm mb-2 text-indigo-600">First Admin User</p>
                            </div>
                            <input placeholder="Admin Name" className="border p-2 rounded" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} required />
                            <input placeholder="Admin Email" type="email" className="border p-2 rounded" value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })} required />
                            <input placeholder="Password" type="password" className="col-span-2 border p-2 rounded" value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })} required />

                            <div className="col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create Company</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
