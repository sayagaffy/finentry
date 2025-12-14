'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Handle Login Submit
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Panggil NextAuth signIn dengan provider 'credentials'
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false, // Handle redirect manual agar lebih smooth
            });

            if (res?.error) {
                setError('Invalid email or password');
                setLoading(false);
            } else {
                // Login sukses, arahkan ke dashboard dan refresh
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center mb-2">
                        <h1 className="text-4xl font-bold text-black tracking-tight">FinEntry</h1>
                        <span className="text-sm font-medium text-black">by Priventry</span>
                    </div>
                    <p className="text-slate-500 text-sm">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Demo Credentials (from seed):</p>
                    <p>admin@maju.com / password</p>
                    <p>admin@sumber.com / password</p>
                </div>
            </div>
        </div>
    );
}
