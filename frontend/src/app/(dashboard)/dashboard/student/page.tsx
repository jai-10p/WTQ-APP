"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect student dashboard to My Exams as requested.
 * We keep the page component but just handle the redirect in useEffect.
 */
export default function StudentDashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard/student/exams');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Redirecting to your exams...</p>
        </div>
    );
}
