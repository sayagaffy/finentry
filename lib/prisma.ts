import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Cek apakah kode berjalan di Edge Runtime (untuk middleware)
    const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';

    if (isEdgeRuntime) {
        // Edge Runtime: Gunakan adaptor Neon serverless
        // Ini diperlukan agar Prisma bisa berjalan di lingkungan edge (seperti Vercel Edge Functions)
        const { PrismaNeon } = require('@prisma/adapter-neon');
        const adapter = new PrismaNeon({
            connectionString: process.env.DATABASE_URL!
        });
        return new PrismaClient({ adapter });
    } else {
        // Node.js Runtime: Gunakan adaptor pg untuk PostgreSQL standar
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

// Menggunakan pola singleton untuk mencegah pembuatan instan koneksi berlebih
// saat pengembangan (hot-reloading)
const prisma = globalThis.prisma ?? prismaClientSingleton();

// Force reload comment
export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
