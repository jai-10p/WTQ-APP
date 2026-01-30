"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';


import Image from 'next/image';

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
                        <span className="text-sm text-gray-500 font-medium mr-2">
                            {user?.username}
                        </span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-8 pb-12 relative">
                    {children}

                    {/* Fixed Logo in red-highlighted area */}
                    <div className="flex flex-col items-center gap-2 fixed bottom-8 right-12 z-10">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                            {/* Powered By */}
                        </span>
                        <a
                            href="https://10pearls.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block grayscale transition-all hover:grayscale-0 dark:invert active:scale-95"
                        >
                            <Image
                                src="/10pearls_logo.png"
                                alt="10Pearls"
                                width={120}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                        </a>
                    </div>
                </main>
            </div>
        </div>
    );
}
