"use client";

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { StatsCard } from '@/components/StatsCard';
import { Users, FileText, ClipboardList, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvigilatorDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response: any = await api.get('/dashboard/invigilator');
                setStats(response.data.data);
            } catch (error) {
                console.error('Failed to fetch invigilator stats:', error);
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invigilator Dashboard</h1>
                <p className="text-gray-500 dark:text-zinc-400 mt-1">Manage your exams and students from here.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="My Exams"
                    value={stats?.myExams || "0"}
                    icon={FileText}
                    color="blue"
                />
                <StatsCard
                    title="Total Attempts"
                    value={stats?.totalAttemptsOnMyExams || "0"}
                    icon={Users}
                    color="green"
                />
                <StatsCard
                    title="My Questions"
                    value={stats?.myQuestions || "0"}
                    icon={ClipboardList}
                    color="purple"
                />
                <StatsCard
                    title="Avg Student Score"
                    value="--%"
                    icon={Clock}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push('/dashboard/invigilator/exams')}
                            className="p-4 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <FileText className="w-6 h-6" />
                            <span className="font-medium">Create Exam</span>
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/invigilator/questions')}
                            className="p-4 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg text-gray-600 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <ClipboardList className="w-6 h-6" />
                            <span className="font-medium">Add Question</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
