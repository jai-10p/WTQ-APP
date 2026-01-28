"use client";

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { StatsCard } from '@/components/StatsCard';
import { Users, Shield, Server, Activity, Loader2, BookOpen, HelpCircle, FileText, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response: any = await api.get('/dashboard/admin');
                setStats(response.data.data);
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
                <p className="text-gray-500 dark:text-zinc-400 mt-1">Welcome back, {user?.username}. Here's what's happening with the platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers || "0"}
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Total Exams"
                    value={stats?.totalExams || "0"}
                    icon={BookOpen}
                    color="green"
                />
                <StatsCard
                    title="Total Questions"
                    value={stats?.totalQuestions || "0"}
                    icon={HelpCircle}
                    color="purple"
                />
                <StatsCard
                    title="Total Attempts"
                    value={stats?.totalAttempts || "0"}
                    icon={Activity}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => router.push('/dashboard/super-admin/users')}
                            className="p-4 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400 hover:border-green-500 dark:hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-zinc-800 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <Users className="w-6 h-6" />
                            <span className="font-medium">Manage Users</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
