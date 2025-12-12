
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userCompanyId = session.user.companyId;

        const rows = await request.json();

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: 'No data to import' }, { status: 400 });
        }

        // Preheat Caches for Lookups (to avoid N+1 queries)
        const [items, customers, vendors] = await Promise.all([
            prisma.item.findMany({ where: { companyId: userCompanyId } }),
            prisma.customer.findMany({ where: { companyId: userCompanyId } }),
            prisma.vendor.findMany({ where: { companyId: userCompanyId } })
        ]);

        const itemMap = new Map(items.map(i => [i.name.toLowerCase(), i]));
        const customerMap = new Map(customers.map(c => [c.name.toLowerCase(), c]));
        const vendorMap = new Map(vendors.map(v => [v.name.toLowerCase(), v]));

        let successCount = 0;
        let errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1; // JSON array index + 1

            // Required Fields
            const dateStr = row['Date'] || row['Tanggal'];
            const typeRaw = row['Type'] || row['Tipe']; // sale/purchase
            const partyName = row['Party'] || row['Pihak'] || row['Customer'] || row['Vendor'];
            const itemName = row['Item'] || row['Barang'];
            const quantity = Number(row['Quantity'] || row['Qty'] || row['Jumlah']);
            const basePrice = Number(row['Base Price'] || row['Harga Dasar'] || row['COGS']);
            const sellPrice = Number(row['Sell Price'] || row['Harga Jual']);

            // Optional
            const transport = Number(row['Transport'] || 0);
            const unexpected = Number(row['Unexpected'] || 0);
            const other = Number(row['Other'] || 0);
            const notes = row['Notes'] || row['Catatan'] || '';

            if (!dateStr || !typeRaw || !partyName || !itemName || !quantity) {
                errors.push(`Row ${rowNum}: Missing required fields`);
                continue;
            }

            // Normalization
            const type = typeRaw.toString().toLowerCase().includes('jual') || typeRaw.toString().toLowerCase() === 'sale' ? 'sale' : 'purchase';

            // Lookups
            const item = itemMap.get(itemName.toString().toLowerCase());
            if (!item) {
                errors.push(`Row ${rowNum}: Item '${itemName}' not found`);
                continue;
            }

            let customerId: string | null = null;
            let vendorId: string | null = null;

            if (type === 'sale') {
                const customer = customerMap.get(partyName.toString().toLowerCase());
                if (!customer) {
                    errors.push(`Row ${rowNum}: Customer '${partyName}' not found`);
                    continue;
                }
                customerId = customer.id;
            } else {
                const vendor = vendorMap.get(partyName.toString().toLowerCase());
                if (!vendor) {
                    errors.push(`Row ${rowNum}: Vendor '${partyName}' not found`);
                    continue;
                }
                vendorId = vendor.id;
            }

            // Parse Date
            let date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // Try parsing from Excel serial if passed as number in JSON (unlikely if pre-parsed by xlsx on client but possible)
                if (typeof dateStr === 'number') {
                    date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
                } else {
                    errors.push(`Row ${rowNum}: Invalid Date '${dateStr}'`);
                    continue;
                }
            }

            // Calculations
            const revenue = quantity * sellPrice;
            const cogs = quantity * basePrice;
            const totalExpenses = transport + unexpected + other;
            const margin = revenue - cogs - totalExpenses;
            const marginPercent = revenue !== 0 ? (margin / revenue) * 100 : 0;

            try {
                await prisma.transaction.create({
                    data: {
                        companyId: userCompanyId,
                        date,
                        type,
                        customerId,
                        vendorId,
                        itemId: item.id,
                        quantity,
                        basePrice,
                        sellPrice,
                        transportCost: transport,
                        unexpectedCost: unexpected,
                        otherCost: other,
                        notes,
                        revenue,
                        cogs,
                        totalExpenses,
                        margin,
                        marginPercent
                    }
                });
                successCount++;
            } catch (err) {
                console.error(err);
                errors.push(`Row ${rowNum}: Database error`);
            }
        }

        // Return format matching ImportModal expectations
        return NextResponse.json({
            count: successCount, // ImportModal expects { count, skipped }
            skipped: errors.length,
            errors,
            message: `Imported ${successCount} transactions. ${errors.length} failed.`
        });

    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: error.message || 'Import Failed' }, { status: 500 });
    }
}
