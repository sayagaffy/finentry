import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Check if we're in Edge Runtime (middleware)
    const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';

    if (isEdgeRuntime) {
        // Edge Runtime: Use Neon serverless adapter
        const { PrismaNeon } = require('@prisma/adapter-neon');
        const adapter = new PrismaNeon({
            connectionString: process.env.DATABASE_URL!
        });
        return new PrismaClient({ adapter });
    } else {
        // Node.js Runtime: Use pg adapter for local PostgreSQL
        const { PrismaPg } = require('@prisma/adapter-pg');
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    }
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Force reload comment
export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
