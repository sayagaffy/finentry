'use client';

import { Printer } from 'lucide-react';

/**
 * Tombol untuk mencetak halaman saat ini.
 * Menggunakan window.print() bawaan browser.
 * Tombol ini akan disembunyikan saat mode cetak aktif (print:hidden).
 */
export default function PrintButton() {
    return (
        <button
            title="Print Invoice"
            onClick={() => window.print()}
            className="bg-orange-600 text-white p-3 rounded-full shadow hover:bg-orange-700 print:hidden"
        >
            <Printer size={24} />
        </button>
    );
}
