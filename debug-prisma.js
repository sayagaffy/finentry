
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Prisma Keys:', Object.keys(prisma));
    console.log('AIConfig property guess:', prisma.aIConfig ? 'exists' : 'missing');
    console.log('aiConfig property guess:', prisma.aiConfig ? 'exists' : 'missing');
    console.log('AIConfig property guess (Pascal):', prisma.AIConfig ? 'exists' : 'missing');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
