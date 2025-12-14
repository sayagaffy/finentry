import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET: List all drivers
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    try {
        const drivers = await prisma.driver.findMany({
            where: {
                companyId: session.user.companyId,
                name: search ? { contains: search, mode: "insensitive" } : undefined,
                status: "active", // Default list active only? Or add parameter
            },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(drivers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
    }
}

// POST: Create a new driver
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, phone, licenseNo } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const driver = await prisma.driver.create({
            data: {
                companyId: session.user.companyId,
                name,
                phone,
                licenseNo,
            },
        });

        return NextResponse.json(driver);
    } catch (error: any) {
        console.error("Error creating driver:", error);
        return NextResponse.json({ error: error.message || "Failed to create driver" }, { status: 500 });
    }
}
