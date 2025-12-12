
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const aiModel = (prisma.aIConfig || prisma.aiConfig);
        if (!aiModel) {
            console.log('AIConfig table access failed in script (check casing?).');
            return;
        }

        const config = await aiModel.findFirst({
            where: { provider: 'GEMINI' }
        });

        if (!config || !config.apiKey) {
            console.log('No Gemini API Config found in DB for testing.');
            return;
        }

        console.log('Found Gemini API Key. Testing connection...');
        const genAI = new GoogleGenerativeAI(config.apiKey);

        // List models
        // Note: SDK might not expose listModels directly on the instance easily in all versions, 
        // but let's try the standard way if available, or just test a few hardcoded ones.
        // Actually, the SDK has a ModelManager.

        // Alternative: minimal fetch if SDK version is restrictive
        const apiKey = config.apiKey;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                if (m.name.includes('flash') || m.name.includes('gemini')) {
                    console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log('Error listing models:', JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
