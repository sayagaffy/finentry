'use client';

import { apiClient } from '@/lib/apiClient';
import { useEffect, useState } from 'react';

import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Plus, Trash, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface Vehicle {
    id: string;
    plateNumber: string;
    type: string | null;
    capacity: number | null;
}

export default function VehiclesPage() {
    const [data, setData] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        plateNumber: '',
        type: 'Truck',
        capacity: ''
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await apiClient<Vehicle[]>('/master-data/vehicles');
            setData(res);
        } catch (e) { toast.error('Failed to load vehicles'); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await apiClient('/master-data/vehicles', {
                method: 'POST',
                body: formData
            });
            toast.success('Vehicle added successfully');
            closeForm();
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add vehicle');
        }
    }

    async function confirmDelete() {
        if (!deleteId) return;
        try {
            // Menghapus kendaraan via API
            await apiClient(`/master-data/vehicles/${deleteId}`, { method: 'DELETE' });
            toast.success('Vehicle deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete vehicle');
        } finally {
            setDeleteId(null);
        }
    }

    function closeForm() {
        setShowForm(false);
        setFormData({ plateNumber: '', type: 'Truck', capacity: '' });
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Truck className="h-6 w-6" /> Vehicles (Armada)
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Vehicle
                </button>
            </div>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                            <th className="px-6 py-3">Plate Number (Plat No)</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Capacity (Kg/Ton)</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">No vehicles found. Add one to start.</td></tr>
                        ) : (
                            data.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium uppercase text-slate-900">{v.plateNumber}</td>
                                    <td className="px-6 py-3">{v.type || '-'}</td>
                                    <td className="px-6 py-3">{v.capacity || '-'}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            // Delete functionality requires implementing DELETE in API first
                                            // For now just showing the button, it might fail if API missing 
                                            // onClick={() => setDeleteId(v.id)} 
                                            className="text-red-500 hover:text-red-700 opacity-50 cursor-not-allowed"
                                            title="Delete not implemented yet"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
                    <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add New Vehicle</h2>
                            <button onClick={closeForm} className="text-slate-500 hover:text-slate-800">Close</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Plate Number</label>
                                <input
                                    className="w-full border rounded p-2 uppercase"
                                    value={formData.plateNumber}
                                    onChange={e => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                                    placeholder="e.g. B 1234 CD"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Truck">Truck</option>
                                    <option value="Pickup">Pickup</option>
                                    <option value="Van">Van</option>
                                    <option value="Motorcycle">Motorcycle</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Capacity (Optional)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-2"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                    placeholder="e.g. 5000"
                                />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">
                                    SAVE VEHICLE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Vehicle"
                message="Are you sure? This cannot be undone."
                confirmText="Delete"
                isDestructive
            />
        </div>
    );
}
