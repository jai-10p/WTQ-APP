"use client";

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { StatsCard } from '@/components/StatsCard';
import { BookOpen, GraduationCap, Clock, Award, Loader2 } from 'lucide-react';

export default function StudentDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, examsRes]: any = await Promise.all([
                    api.get('/dashboard/student'),
                    api.get('/student/exams')
                ]);

                if (statsRes.data?.success) {
                    setStats(statsRes.data.data);
                }

                if (examsRes.data?.success) {
                    setUpcomingExams(examsRes.data.data?.exams?.slice(0, 5) || []);
                }
            } catch (error: any) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Learning</h1>
                <p className="text-gray-500 dark:text-zinc-400 mt-1">Track your progress and upcoming exams.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Available Exams"
                    value={stats?.totalExamsAvailable || "0"}
                    icon={BookOpen}
                    color="blue"
                />
                <StatsCard
                    title="My Attempts"
                    value={stats?.myAttempts || "0"}
                    icon={GraduationCap}
                    color="green"
                />
                <StatsCard
                    title="Avg. Score"
                    value={`${stats?.averageScore || 0}%`}
                    icon={Award}
                    color="purple"
                />
                <StatsCard
                    title="Time Spent"
                    value="--h"
                    icon={Clock}
                    color="orange"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Exams</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-zinc-800">
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-zinc-400">Exam Title</th>
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-zinc-400">Duration</th>
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-zinc-400">Status</th>
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-zinc-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {upcomingExams.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-zinc-500">
                                        No upcoming exams found.
                                    </td>
                                </tr>
                            ) : (
                                upcomingExams.map((exam) => (
                                    <tr key={exam.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">{exam.exam_title}</td>
                                        <td className="py-4 text-sm text-gray-600 dark:text-zinc-400">{exam.duration_minutes} mins</td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                                Active
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => router.push('/dashboard/student/exams')}
                                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                            >
                                                Start Exam
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
