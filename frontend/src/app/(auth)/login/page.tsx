"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Assuming backend endpoint /auth/login returns { token, user }
            // For now, we'll simulate or try to hit endpoint.
            // Since backend auth isn't fully built in previous steps (only User model),
            // this might fail if we actually run it against the current backend.
            // But this is the architectures correct setup.

            const response = await api.post('/auth/login', { email, password });
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
        <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                Sign in to your account
            </h2>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="-space-y-px rounded-md shadow-sm">
                    <div>
                        <input
                            type="email"
                            required
                            className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            required
                            className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-blue-600 py-2 px-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-400"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>
        </div>
    );
}
