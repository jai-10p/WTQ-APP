"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

export default function LoginPage() {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Use identifier as email (assuming backend handles both or user enters email)
            const response = await api.post('/auth/login', {
                email: identifier,
                password
            });
            const { token, user } = response.data.data;
            showToast('Login successful!', 'success');
            login(token, user);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50">
            {/* Left Panel - Banner Experience */}
            <div className="hidden lg:flex lg:w-[60%] relative bg-[#0a192f] flex-col items-center justify-center overflow-hidden">
                {/* Techy Glow Elements in Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#112240_0%,_#0a192f_70%)]"></div>
                    <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                </div>

                {/* Seamless Foreground Image */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                    <div className="relative w-full h-full max-w-[90%] max-h-[90%] transition-all duration-1000 hover:scale-[1.02]">
                        <Image
                            src="/wtq_banner.png"
                            alt="Women Tech Quest 2026"
                            fill
                            className="object-contain drop-shadow-[0_0_50px_rgba(59,130,246,0.15)]"
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative bg-white lg:rounded-l-[40px] shadow-[-20px_0_50px_rgba(0,0,0,0.02)] z-20">
                <div className="w-full max-w-[440px] space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                            Authentication Required
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                                Welcome!
                            </h1>
                            <p className="text-slate-500 text-base font-medium">
                                Step into the arena. Ready to conquer?
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                                        placeholder="admin@example.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Password</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !identifier || !password}
                            className={`w-full py-5 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] ${(loading || !identifier || !password)
                                    ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.3)] transform hover:-translate-y-1"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="animate-pulse">Authorizing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Access My Account</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer / Branding */}
                    <div className="pt-8 flex flex-col items-center gap-6 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-10 bg-slate-100"></div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Partner Hub</span>
                            <div className="h-px w-10 bg-slate-100"></div>
                        </div>
                        <a
                            href="https://10pearls.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block transition-all hover:scale-105 active:scale-95 duration-500"
                        >
                            <Image
                                src="/10pearls_logo.png"
                                alt="10Pearls"
                                width={160}
                                height={50}
                                className="object-contain"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
