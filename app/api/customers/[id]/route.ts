import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/customers/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15+ params params is now a Promise
) {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
        where: { id },
    });

    if (!customer) {
        return NextResponse.json(
            { error: "Customer not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ data: customer });
}

// PUT /api/customers/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, contact, address } = body;

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                contact,
                address,
            },
        });

        return NextResponse.json({ data: customer });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}

// DELETE /api/customers/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Check if customer has transactions
        const count = await prisma.transaction.count({
            where: { customerId: id },
        });

        if (count > 0) {
            return NextResponse.json(
                { error: "Cannot delete customer with existing transactions" },
                { status: 400 }
            );
        }

        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete customer" },
            { status: 500 }
        );
    }
}
