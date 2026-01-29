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
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Left Panel - Banner */}
            <div className="hidden lg:flex lg:w-[60%] relative bg-[#1B4D6B] flex-col items-center justify-center p-12 overflow-hidden">
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <Image
                        src="/wtq_banner.png"
                        alt="Women Tech Quest 2026"
                        fill
                        className="object-cover opacity-90"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1B4D6B]/50 to-transparent"></div>

                    {/* Floating Branding / Text Overlay if needed */}
                    <div className="absolute bottom-12 left-12 z-20">
                        <div className="text-white">
                            <h2 className="text-2xl font-bold">Welcome to</h2>
                            <h3 className="text-4xl font-black text-yellow-400 drop-shadow-lg">
                                WomenTechQuest Exam Portal
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white">
                <div className="w-full max-w-[440px] space-y-10">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                            Welcome!
                        </h1>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Login to your account
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">
                            It's nice to see you. Ready to code?
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1B4D6B]/20 focus:border-[#1B4D6B] transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="Your username or email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1B4D6B]/20 focus:border-[#1B4D6B] transition-all text-gray-900 placeholder:text-gray-400"
                                    placeholder="Your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* <div className="flex items-center justify-between py-2">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-[#1B4D6B] focus:ring-[#1B4D6B]"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-semibold text-[#1B4D6B] hover:text-[#143950]">
                                    Forgot password?
                                </a>
                            </div>
                        </div> */}

                        <button
                            type="submit"
                            disabled={loading || !identifier || !password}
                            className={`w-full py-4 px-6 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${identifier && password
                                ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                                : "bg-[#E5E7EB] text-gray-400 cursor-not-allowed shadow-none"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Logging in...
                                </>
                            ) : (
                                "Log In"
                            )}
                        </button>
                    </form>

                    {/* Footer / Branding */}
                    <div className="pt-12 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-px w-12 bg-gray-200"></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Powered By</span>
                            <div className="h-px w-12 bg-gray-200"></div>
                        </div>
                        <a
                            href="https://10pearls.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block grayscale transition-all hover:grayscale-0 active:scale-95"
                        >
                            <Image
                                src="/10pearls_logo.png"
                                alt="10Pearls"
                                width={180}
                                height={60}
                                className="object-contain"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
