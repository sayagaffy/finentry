'use client';

import { apiClient } from '@/lib/apiClient';
import { Check, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AISettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        provider: 'GROQ',
        apiKey: '',
        model: 'llama3-8b-8192',
        isActive: true
    });

    useEffect(() => { loadConfig(); }, []);

    async function loadConfig() {
        try {
            const res = await apiClient<any>('/ai/config');
            if (res && res.provider) {
                setConfig({
                    provider: res.provider,
                    apiKey: res.apiKey || '',
                    model: res.model,
                    isActive: res.isActive
                });
            }
        } catch (error) {
            // No config yet, use defaults
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient('/ai/config', { method: 'POST', body: config });
            toast.success('AI Configuration saved successfully!');
        } catch (error: any) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    }

    const providers = [
        { id: 'GROQ', name: 'Groq (Llama 3)', free: true, url: 'https://console.groq.com/keys' },
        { id: 'GEMINI', name: 'Google Gemini', free: true, url: 'https://aistudio.google.com/app/apikey' },
        { id: 'OPENAI', name: 'OpenAI (GPT)', free: false, url: 'https://platform.openai.com/api-keys' },
    ];

    const models: any = {
        'GROQ': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile'],
        'GEMINI': ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-001'],
        'OPENAI': ['gpt-3.5-turbo', 'gpt-4o'],
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">AI Assistant Settings</h1>

            <div className="bg-white rounded-lg shadow border p-6">
                <form onSubmit={handleSave} className="space-y-6">

                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {providers.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setConfig({ ...config, provider: p.id, model: models[p.id][0], apiKey: '' })}
                                    className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center text-center transition-all ${config.provider === p.id
                                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                        : 'hover:border-gray-400'
                                        }`}
                                >
                                    <span className="font-semibold text-gray-900">{p.name}</span>
                                    {p.free && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">Free Tier Available</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                            type="password"
                            value={config.apiKey}
                            onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                            placeholder={`Enter your ${providers.find(p => p.id === config.provider)?.name} API Key`}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Don't have a key? <a href={providers.find(p => p.id === config.provider)?.url} target="_blank" className="text-indigo-600 hover:underline">Get one here for free</a>.
                        </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                        <select
                            value={config.model}
                            onChange={e => setConfig({ ...config, model: e.target.value })}
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            {models[config.provider]?.map((m: string) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={config.isActive}
                            onChange={e => setConfig({ ...config, isActive: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Enable AI Assistant</label>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
