"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'admin') {
                router.push('/dashboard/super-admin');
            } else if (user.role === 'invigilator') {
                router.push('/dashboard/invigilator');
            } else {
                router.push('/dashboard/student');
            }
        }
    }, [user, loading, router]);

    return <div className="flex items-center justify-center h-full">Redirecting to your dashboard...</div>;
}
