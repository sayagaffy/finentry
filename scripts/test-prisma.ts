
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Connection...');
    try {
        const items = await prisma.item.findMany({
            where: {
                deleted: false
            },
            take: 1
        });
        console.log('Successfully fetched items:', items);
        console.log('Schema and DB are in sync.');
    } catch (error) {
        console.error('Error fetching items:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
