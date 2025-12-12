import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/items/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15+ params is now a Promise
) {
    const { id } = await params;
    const item = await prisma.item.findUnique({
        where: { id },
    });

    if (!item) {
        return NextResponse.json(
            { error: "Item not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ data: item });
}

// PUT /api/items/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, unit, category } = body;

        const item = await prisma.item.update({
            where: { id },
            data: {
                name,
                unit,
                category,
            },
        });

        return NextResponse.json({ data: item });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update item" },
            { status: 500 }
        );
    }
}

// DELETE /api/items/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Check if item has transactions
        const count = await prisma.transaction.count({
            where: { itemId: id },
        });

        if (count > 0) {
            return NextResponse.json(
                { error: "Cannot delete item with existing transactions" },
                { status: 400 }
            );
        }

        await prisma.item.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        );
    }
}
