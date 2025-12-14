import { auth } from '@/auth';
import PrintButton from '@/components/shared/PrintButton';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { notFound, redirect } from 'next/navigation';

export default async function TaxInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    // Await params as per Next.js 15+ requirements
    const { id } = await params;

    const session = await auth();
    if (!session?.user) redirect('/login');

    const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
            customer: true,
            company: true,
            item: true
        }
    });

    if (!transaction) notFound();

    // Basic Access Control
    if (transaction.companyId !== session.user.companyId && session.user.role !== 'OWNER') {
        return <div className="p-10 text-center text-red-500">Unauthorized Access</div>;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const isPMK62 = transaction.taxType === 'LPG_PMK62';
    // const isStandard = transaction.taxType === 'VAT_11';

    // Logic DPP (Dasar Pengenaan Pajak) / Tax Base
    let dpp = 0;
    if (isPMK62) {
        // Untuk PMK 62 (LPG), DPP dihitung dari margin (selisih harga), bukan total omzet
        dpp = transaction.margin;
    } else {
        dpp = transaction.revenue;
    }

    const ppn = transaction.ppnAmount || 0;

    // Grand Total: Revenue asli + PPN yang harus ditagih
    const grandTotal = transaction.revenue + ppn;

    return (
        <div className="min-h-screen bg-slate-100 p-8 flex justify-center items-start print:bg-white print:p-0">
            <div className="bg-white shadow-lg w-[210mm] min-h-[148mm] p-[10mm] relative print:shadow-none print:w-full">

                {/* Print Button (Client Component) */}
                <div className="absolute top-4 right-[-80px] print:hidden">
                    <PrintButton />
                </div>

                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Faktur Pajak</h1>
                        <p className="text-sm font-semibold text-slate-600">
                            {isPMK62 ? 'Kode: 05 (Besaran Tertentu - LPG)' : 'Kode: 01 (Umum)'}
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">{transaction.company.name}</h2>
                        <p className="text-xs text-slate-500">NPWP: 00.000.000.0-000.000 (Demo)</p>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
                    <div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="w-24 text-slate-500">Kepada:</td>
                                    <td className="font-bold">{transaction.customer?.name}</td>
                                </tr>
                                <tr>
                                    <td className="text-slate-500">Alamat:</td>
                                    <td>{transaction.customer?.address || '-'}</td>
                                </tr>
                                <tr>
                                    <td className="text-slate-500">NPWP/NIK:</td>
                                    <td>{transaction.customer?.identityNumber || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="w-32 text-slate-500">No. Faktur:</td>
                                    <td className="font-mono font-bold">{transaction.invoiceNumber}</td>
                                </tr>
                                <tr>
                                    <td className="text-slate-500">Tanggal:</td>
                                    <td>{format(new Date(transaction.date), 'dd MMMM yyyy', { locale: idLocale })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Items */}
                <table className="w-full border-collapse mb-6 text-sm">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-300">
                            <th className="py-2 text-left pl-2">Keterangan Barang/Jasa</th>
                            <th className="py-2 text-right">Qty</th>
                            <th className="py-2 text-right">Harga Satuan</th>
                            <th className="py-2 text-right pr-2">Jumlah Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-200">
                            <td className="py-3 pl-2">
                                <div className="font-semibold">{transaction.item.name}</div>
                                {isPMK62 && <div className="text-xs text-slate-500">(LPG Tertentu - PMK 62/2022)</div>}
                            </td>
                            <td className="py-3 text-right">{transaction.quantity} {transaction.item.unit}</td>
                            <td className="py-3 text-right">{formatCurrency(transaction.sellPrice)}</td>
                            <td className="py-3 text-right pr-2 font-medium">{formatCurrency(transaction.revenue)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Calculations */}
                <div className="flex justify-end mb-8">
                    <div className="w-1/2 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Total Harga Jual (DPP)</span>
                            <span className="font-medium">{formatCurrency(transaction.revenue)}</span>
                        </div>

                        {/* PPN Breakdown */}
                        {isPMK62 && (
                            <div className="my-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <p className="font-semibold text-yellow-800">Keterangan PPN (Besaran Tertentu):</p>
                                <div className="flex justify-between mt-1">
                                    <span>Rate Efektif (dari Jual)</span>
                                    <span>{(transaction.revenue > 0 ? (ppn / transaction.revenue * 100) : 0).toFixed(2)}%</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between text-slate-800 font-bold text-base border-t border-slate-300 pt-2 mt-2">
                            <span>PPN {isPMK62 ? '(Final)' : '(11%)'}</span>
                            <span>{formatCurrency(ppn)}</span>
                        </div>

                        <div className="flex justify-between text-white bg-slate-800 p-2 rounded mt-4">
                            <span className="font-bold">TOTAL TAGIHAN</span>
                            <span className="font-bold">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-400 text-center mt-auto border-t pt-4">
                    Dokumen ini sah dan diproses secara elektronik oleh FinTrack System.
                </div>
            </div>
        </div>
    );
}
