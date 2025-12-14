import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PrintDeliveryOrderPage({ params }: Props) {
    const { id: doId } = await params;
    const session = await auth();
    if (!session?.user?.companyId) return <div>Unauthorized</div>;

    const deliveryOrder = await prisma.deliveryOrder.findUnique({
        where: { id: doId },
        include: {
            company: true,
            vehicle: true,
            driver: true,
            transactions: {
                include: {
                    customer: true,
                    item: true
                }
            }
        }
    });

    if (!deliveryOrder || deliveryOrder.companyId !== session.user.companyId) {
        return notFound();
    }

    return (
        <div className="p-8 max-w-4xl mx-auto font-sans text-black bg-white min-h-screen print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Surat Jalan</h1>
                    <p className="text-sm mt-1">{deliveryOrder.company.name}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{deliveryOrder.doNumber}</p>
                    <p className="text-sm">{format(new Date(deliveryOrder.date), 'dd MMMM yyyy', { locale: id })}</p>
                </div>
            </div>

            {/* Logistics Info */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div>
                    <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">Armada & Supir</h3>
                    <table className="w-full">
                        <tbody>
                            <tr>
                                <td className="py-1 w-24 text-gray-600">Kendaraan</td>
                                <td className="font-mono font-bold">{deliveryOrder.vehicle.plateNumber}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-gray-600">Supir</td>
                                <td>{deliveryOrder.driver.name}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-gray-600">Kontak</td>
                                <td>{deliveryOrder.driver.phone || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div>
                    <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">Catatan Pengiriman</h3>
                    <p className="italic text-gray-700">{deliveryOrder.notes || 'Tidak ada catatan khusus.'}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left w-12">No</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Customer / Penerima</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Nama Barang</th>
                            <th className="border border-gray-300 px-4 py-2 text-right w-32">Kuantitas</th>
                            <th className="border border-gray-300 px-4 py-2 text-left w-24">Satuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveryOrder.transactions.map((t, index) => (
                            <tr key={t.id}>
                                <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                                <td className="border border-gray-300 px-4 py-2">
                                    <div className="font-bold">{t.customer?.name}</div>
                                    <div className="text-xs text-gray-500">{t.customer?.address || ''}</div>
                                </td>
                                <td className="border border-gray-300 px-4 py-2">{t.item.name}</td>
                                <td className="border border-gray-300 px-4 py-2 text-right font-mono text-base">{t.quantity}</td>
                                <td className="border border-gray-300 px-4 py-2">{t.item.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-3 gap-8 mt-12 text-center text-sm">
                <div>
                    <p className="mb-16">Pengirim / Admin</p>
                    <div className="border-t border-black w-3/4 mx-auto"></div>
                </div>
                <div>
                    <p className="mb-16">Supir</p>
                    <div className="border-t border-black w-3/4 mx-auto"></div>
                    <p className="mt-2 font-bold">{deliveryOrder.driver.name}</p>
                </div>
                <div>
                    <p className="mb-16">Penerima</p>
                    <div className="border-t border-black w-3/4 mx-auto"></div>
                </div>
            </div>

            {/* Trigger Print Otomatis saat halaman dimuat */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.print();`
                }}
            />
        </div>
    );
}
