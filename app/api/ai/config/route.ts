
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await auth();
    const user = session?.user;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let companyId = user.companyId;

    // If Owner has no context, fetch the first company they have access to (or just the first one in DB for now)
    if (!companyId && user.role === 'OWNER') {
        const firstCompany = await prisma.company.findFirst();
        companyId = firstCompany?.id;
    }

    if (!companyId) return NextResponse.json({ error: 'No Company Found' }, { status: 404 });

    const aiModel = (prisma as any).aIConfig || (prisma as any).aiConfig;
    const config = await aiModel.findUnique({
        where: { companyId: companyId }
    });

    return NextResponse.json(config || {});
}

export async function POST(request: Request) {
    const session = await auth();
    const user = session?.user;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let companyId = user.companyId;

    const body = await request.json();
    const { provider, apiKey, model, isActive } = body;

    // If Owner has no context, fetch the first company
    if (!companyId && user.role === 'OWNER') {
        const firstCompany = await prisma.company.findFirst();
        if (!firstCompany) return NextResponse.json({ error: 'No Company Found' }, { status: 404 });
        // Use the ID found
        const aiModel = (prisma as any).aIConfig || (prisma as any).aiConfig;
        const config = await aiModel.upsert({
            where: { companyId: firstCompany.id },
            update: { provider, apiKey, model, isActive },
            create: { companyId: firstCompany.id, provider, apiKey, model, isActive }
        });
        return NextResponse.json(config);
    }

    if (!companyId) return NextResponse.json({ error: 'No Company Found' }, { status: 404 });

    // Normal flow
    const aiModel = (prisma as any).aIConfig || (prisma as any).aiConfig;
    const config = await aiModel.upsert({
        where: { companyId: companyId },
        update: { provider, apiKey, model, isActive },
        create: { companyId: companyId, provider, apiKey, model, isActive }
    });

    return NextResponse.json(config);
}
