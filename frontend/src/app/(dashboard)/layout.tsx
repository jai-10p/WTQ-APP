"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

import { ThemeToggle } from '@/components/ThemeToggle';

// ... (imports)

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors">
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="flex justify-end items-center p-4 pr-8 pt-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 font-medium mr-2">
                            {user?.username}
                        </span>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-8 pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
