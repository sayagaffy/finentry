'use client';

import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    resource: 'customers' | 'vendors' | 'items' | 'transactions'; // Jenis data yang akan diimpor
}

// Template data untuk setiap jenis resource agar user tahu format excel yang benar
const TEMPLATES = {
    customers: [{ name: 'John Doe', contact: '08123456789', address: 'Jakarta' }],
    vendors: [{ name: 'PT Vendor Jaya', type: 'vendor', contact: 'sales@vendor.com' }],
    items: [{ name: 'Besi Beton', unit: 'batang', category: 'Material' }],
    transactions: [{
        Date: '2023-12-01',
        Type: 'sale', // or purchase
        Party: 'Customer Name or Vendor Name',
        Item: 'Item Name',
        Quantity: 10,
        'Base Price': 50000,
        'Sell Price': 75000,
        Transport: 0,
        Unexpected: 0,
        Other: 0,
        Notes: 'Optional notes'
    }]
};

export default function ImportModal({ isOpen, onClose, onSuccess, resource }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<{ count: number; skipped: number } | null>(null);

    if (!isOpen) return null;

    // Menangani perubahan file input (saat user memilih file Excel)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');
        setStats(null);

        // Membaca file menggunakan FileReader dan library XLSX
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0]; // Ambil sheet pertama
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws); // Konversi ke JSON
                setPreviewData(data);
            } catch (err) {
                console.error(err);
                setError('Failed to parse file. Please ensure it is a valid Excel file.');
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet(TEMPLATES[resource]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `${resource}_template.xlsx`);
    };

    // Mengirim data JSON yang sudah diparsing ke API backend
    const handleImport = async () => {
        if (!previewData.length) return;
        setLoading(true);
        setError('');

        try {
            const endpoint = resource === 'transactions' ? '/api/transactions/import' : `/api/${resource}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(previewData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to import data');
            }

            const result = await res.json();
            setStats(result); // Simpan statistik hasil import (sukses/skip)
            setFile(null);
            setPreviewData([]);

            // Tutup modal otomatis setelah 2 detik sukses
            setTimeout(() => {
                onClose();
                onSuccess();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setError('');
        setStats(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">Import {resource}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {stats ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-900">Import Successful!</h4>
                                <p className="text-gray-500 mt-1">
                                    Added <span className="font-bold text-green-600">{stats.count}</span> records.
                                    <br />
                                    Skipped <span className="font-bold text-orange-500">{stats.skipped}</span> duplicates.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!file ? (
                                <div className="space-y-4">
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                            <Upload className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">Click to upload Excel file</p>
                                        <p className="text-xs text-gray-500 mt-1">.xlsx or .csv files supported</p>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".xlsx, .xls, .csv"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download Template
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                                                <p className="text-xs text-gray-500">{previewData.length} records found</p>
                                            </div>
                                        </div>
                                        <button onClick={reset} className="text-sm text-red-600 hover:text-red-800 font-medium">
                                            Change
                                        </button>
                                    </div>

                                    {previewData.length > 0 && (
                                        <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {Object.keys(previewData[0]).map((key) => (
                                                            <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                {key}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {previewData.slice(0, 5).map((row, idx) => (
                                                        <tr key={idx}>
                                                            {Object.values(row).map((val: any, i) => (
                                                                <td key={i} className="px-3 py-2 text-sm text-gray-500 truncate max-w-[150px]">
                                                                    {val}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {previewData.length > 5 && (
                                                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 text-center border-t">
                                                    ...and {previewData.length - 5} more
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start gap-2 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    {!stats && (
                        <button
                            onClick={handleImport}
                            disabled={!file || loading || previewData.length === 0}
                            className={`px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 ${!file || loading || previewData.length === 0
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {loading ? 'Importing...' : 'Import Data'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
