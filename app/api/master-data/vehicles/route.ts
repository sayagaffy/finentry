import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET: List all vehicles
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { plateNumber: "asc" },
        });
        return NextResponse.json(vehicles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }
}

// POST: Create a new vehicle
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { plateNumber, type, capacity } = body;

        if (!plateNumber) return NextResponse.json({ error: "Plate number required" }, { status: 400 });

        const vehicle = await prisma.vehicle.create({
            data: {
                companyId: session.user.companyId,
                plateNumber,
                type,
                capacity: capacity ? Number(capacity) : null
            }
        });

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error("Error creating vehicle:", error);
        return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
    }
}
