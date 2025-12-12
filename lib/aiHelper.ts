
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

interface AIResponse {
    answer: string;
}

export interface AICompletionParams {
    provider: string; // 'GROQ' | 'GEMINI' | 'OPENAI'
    apiKey: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
}

export async function generateAIResponse(params: AICompletionParams): Promise<AIResponse> {
    const { provider, apiKey, model, systemPrompt, userPrompt } = params;

    try {
        if (provider === 'GEMINI') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.5-flash' });

            const result = await geminiModel.generateContent([
                systemPrompt,
                "\n\nUser Question: " + userPrompt
            ]);
            const response = await result.response;
            return { answer: response.text() };
        }

        if (provider === 'GROQ' || provider === 'OPENAI') {
            const baseURL = provider === 'GROQ'
                ? 'https://api.groq.com/openai/v1'
                : 'https://api.openai.com/v1';

            const openai = new OpenAI({
                apiKey: apiKey,
                baseURL: baseURL,
            });

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: model || (provider === 'GROQ' ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo'),
                temperature: 0.5,
            });

            return { answer: completion.choices[0]?.message?.content || "No response generated." };
        }

        throw new Error(`Unsupported provider: ${provider}`);
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        throw new Error(error.message || 'Failed to generate AI response');
    }
}
