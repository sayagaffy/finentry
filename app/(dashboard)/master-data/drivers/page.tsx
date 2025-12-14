'use client';

import { apiClient } from '@/lib/apiClient';
import { Plus, Trash, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Driver {
    id: string;
    name: string;
    phone: string | null;
    licenseNo: string | null;
    status: string;
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form data
    const [formData, setFormData] = useState({ name: '', phone: '', licenseNo: '' });

    useEffect(() => {
        fetchDrivers();
    }, []);

    async function fetchDrivers() {
        setLoading(true);
        try {
            // Mengambil data supir dari API
            const data = await apiClient<Driver[]>('/master-data/drivers');
            setDrivers(data);
        } catch (error) {
            toast.error('Gagal memuat data supir');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await apiClient('/master-data/drivers', {
                method: 'POST',
                body: formData
            });
            toast.success('Supir berhasil ditambahkan');
            setShowForm(false);
            setFormData({ name: '', phone: '', licenseNo: '' });
            fetchDrivers();
        } catch (error) {
            toast.error('Gagal menambah supir');
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Data Supir (Drivers)
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Tambah Supir
                </button>
            </div>

            {/* List Drivers */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                            <th className="px-6 py-3">Nama</th>
                            <th className="px-6 py-3">No. HP</th>
                            <th className="px-6 py-3">No. SIM</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : drivers.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-500">Belum ada data supir</td></tr>
                        ) : (
                            drivers.map((d) => (
                                <tr key={d.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{d.name}</td>
                                    <td className="px-6 py-3 text-slate-600">{d.phone || '-'}</td>
                                    <td className="px-6 py-3 font-mono text-xs">{d.licenseNo || '-'}</td>
                                    <td className="px-6 py-3">
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button className="text-red-600 hover:text-red-800 text-xs font-medium">Hapus</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-lg font-bold mb-4">Tambah Supir Baru</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama Supir</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border rounded p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">No. HP</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">No. SIM</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2"
                                    value={formData.licenseNo}
                                    onChange={e => setFormData({ ...formData, licenseNo: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
