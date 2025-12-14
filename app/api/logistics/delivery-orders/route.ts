import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET: Mengambil daftar Surat Jalan (Delivery Orders)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const deliveryOrders = await prisma.deliveryOrder.findMany({
            where: { companyId: session.user.companyId },
            include: {
                vehicle: true, // Tampilkan Plat Nomor
                driver: true,  // Tampilkan Nama Sopir
                transactions: {
                    select: { id: true, invoiceNumber: true, customer: { select: { name: true } } }
                }
            },
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(deliveryOrders);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch DOs" }, { status: 500 });
    }
}

// POST: Create a new Delivery Order (Assign Invoices to Vehicle)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { date, vehicleId, driverId, transactionIds, notes } = body;

        if (!vehicleId || !driverId || !transactionIds || transactionIds.length === 0) {
            return NextResponse.json({ error: "Vehicle, Driver, and at least one Invoice are required" }, { status: 400 });
        }

        // Generate Nomor DO Otomatis (Format: DO/YY/MM/001)
        const count = await prisma.deliveryOrder.count({ where: { companyId: session.user.companyId } });
        const doNumber = `DO/${new Date().getFullYear()}/${(count + 1).toString().padStart(3, '0')}`;

        // Create DO dan update transaksi terkait dalam satu database transaction
        const deliveryOrder = await prisma.$transaction(async (tx) => {
            const newDO = await tx.deliveryOrder.create({
                data: {
                    companyId: session.user.companyId!,
                    doNumber,
                    date: new Date(date),
                    vehicleId,
                    driverId,
                    notes,
                    status: 'pending'
                }
            });

            // Associate transactions with this DO
            await tx.transaction.updateMany({
                where: { id: { in: transactionIds }, companyId: session.user.companyId! },
                data: { deliveryOrderId: newDO.id }
            });

            return newDO;
        });

        return NextResponse.json(deliveryOrder);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create Delivery Order" }, { status: 500 });
    }
}
