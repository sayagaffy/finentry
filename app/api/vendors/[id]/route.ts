import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/vendors/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15+ params is now a Promise
) {
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
        where: { id },
    });

    if (!vendor) {
        return NextResponse.json(
            { error: "Vendor not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ data: vendor });
}

// PUT /api/vendors/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, type, contact } = body;

        const vendor = await prisma.vendor.update({
            where: { id },
            data: {
                name,
                type,
                contact,
            },
        });

        return NextResponse.json({ data: vendor });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update vendor" },
            { status: 500 }
        );
    }
}

// DELETE /api/vendors/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Check if vendor has transactions
        const count = await prisma.transaction.count({
            where: { vendorId: id },
        });

        if (count > 0) {
            return NextResponse.json(
                { error: "Cannot delete vendor with existing transactions" },
                { status: 400 }
            );
        }

        await prisma.vendor.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete vendor" },
            { status: 500 }
        );
    }
}
