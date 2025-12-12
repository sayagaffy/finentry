'use client';

import { apiClient } from '@/lib/apiClient';
import { Bot, Send, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function AssistantPage() {
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Halo! Saya asisten keuangan Anda. Ada yang bisa saya bantu tentang laporan keuangan?" }
    ]);
    const [loading, setLoading] = useState(false);

    async function handleSend() {
        if (!query.trim()) return;

        const userMsg = query;
        setQuery('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res: any = await apiClient('/ai/ask', {
                method: 'POST',
                body: { query: userMsg } // Date range optional, standard is current month
            });

            setChatHistory(prev => [...prev, { role: 'assistant', content: res.answer }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Maaf, saya sedang mengalami gangguan sistem." }]);
        } finally {
            setLoading(false);
        }
    }

    const presets = [
        "Berapa laba bulan ini?",
        "Berapa total biaya transport bulan lalu?",
        "Siapa 3 customer dengan pembelian terbesar?",
        "Bagaimana tren margin penjualan kita?"
    ];

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <Bot className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">AI Finance Assistant</h1>
                        <p className="text-slate-500">Tanyakan apa saja tentang data keuangan Anda</p>
                    </div>
                </div>
                <button
                    onClick={() => window.location.href = '/ai/settings'}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Configure AI Settings"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                }`}>
                                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-50 text-slate-500 rounded-2xl rounded-bl-none px-5 py-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Sedang menganalisa data...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-slate-50">
                    {/* Presets */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {presets.map(p => (
                            <button
                                key={p}
                                onClick={() => setQuery(p)}
                                className="whitespace-nowrap px-3 py-1 bg-white border border-indigo-200 text-indigo-600 rounded-full text-sm hover:bg-indigo-50 transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Ketik pertanyaan Anda di sini..."
                            className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !query.trim()}
                            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
