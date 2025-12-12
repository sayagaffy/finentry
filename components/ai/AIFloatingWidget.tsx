'use client';

import { apiClient } from '@/lib/apiClient';
import { Bot, ChevronDown, Maximize2, MessageSquare, Minimize2, Send, Settings, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function AIFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Halo! Saya asisten keuangan Anda. Ada yang bisa saya bantu?" }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

    async function handleSend() {
        if (!query.trim()) return;

        const userMsg = query;
        setQuery('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res: any = await apiClient('/ai/ask', {
                method: 'POST',
                body: { query: userMsg }
            });

            setChatHistory(prev => [...prev, { role: 'assistant', content: res.answer }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Maaf, saya sedang mengalami gangguan sistem." }]);
        } finally {
            setLoading(false);
        }
    }

    // Presets can be shown if chat is empty or on demand, let's keep it simple for widget
    // Maybe show presets only when history is just the greeting?
    const showPresets = chatHistory.length === 1;
    const presets = [
        "Profit bulan ini?",
        "Top 3 customer?",
        "Total pengeluaran?"
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-50 flex items-center gap-2 group"
            >
                <div className="relative">
                    <Bot className="w-8 h-8" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span>
                </div>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-medium">
                    Ask AI
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 max-h-[600px] h-[80vh] bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            {/* Header */}
            <div className="p-4 bg-indigo-600 rounded-t-2xl flex items-center justify-between text-white shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Finance Assistant</h3>
                        <div className="flex items-center gap-1.5 opacity-90">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] uppercase tracking-wider font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => window.location.href = '/ai/settings'}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Minimize"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                            }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2 shadow-sm text-sm">
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            <span className="typing-dots">Thinking</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t rounded-b-2xl">
                {showPresets && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                        {presets.map(p => (
                            <button
                                key={p}
                                onClick={() => { setQuery(p); }} // Just set, user clicks send or we create separate handler
                                className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Tanya data..."
                        className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none text-slate-900 placeholder:text-slate-400"
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !query.trim()}
                        className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
