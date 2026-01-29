"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Users,
    Trophy,
    Search,
    Filter,
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    UserCheck,
    Clock
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import clsx from 'clsx';

export default function ExamAttemptsPage() {
    const params = useParams();
    const examId = params.id;
    const router = useRouter();
    const { showToast } = useToast();

    const [exam, setExam] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (examId) {
            fetchData();
        }
    }, [examId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [examRes, attemptsRes]: any = await Promise.all([
                api.get(`/exams/${examId}`),
                api.get(`/exams/${examId}/attempts`)
            ]);

            setExam(examRes.data.data);
            setAttempts(attemptsRes.data.data);
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
            showToast(error.response?.data?.message || 'Failed to load attempts data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredAttempts = attempts.filter(attempt =>
        attempt.student?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attempt.student?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading student attempts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/invigilator/exams"
                        className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
                        <p className="text-gray-500 mt-1">
                            Viewing attempts for <span className="text-green-600 font-semibold">{exam?.exam_title}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold">{attempts.length} Attempts</span>
                    </div>
                    <div className="bg-white border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold">
                            {attempts.filter(a => a.result?.is_passed).length} Passed
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by student name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => showToast('Export feature coming soon!', 'info')}
                        className="flex items-center gap-2 text-gray-600 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export results
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Attempt Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAttempts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <UserCheck className="w-12 h-12 text-gray-200 mb-3" />
                                            <p>No attempts found for this exam.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAttempts.map((attempt, index) => (
                                    <tr key={attempt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                index === 0 ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400" :
                                                    index === 1 ? "bg-gray-100 text-gray-700 ring-2 ring-gray-400" :
                                                        index === 2 ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400" :
                                                            "text-gray-400"
                                            )}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs uppercase">
                                                    {attempt.student?.username.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{attempt.student?.username}</p>
                                                    <p className="text-[11px] text-gray-500">{attempt.student?.email} • {attempt.student?.designation || 'No Designation'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={clsx(
                                                    "text-sm font-bold",
                                                    attempt.result?.is_passed ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {attempt.result?.percentage}%
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {attempt.result?.total_score} / {attempt.result?.max_score}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                                attempt.result?.is_passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {attempt.result?.is_passed ? (
                                                    <><CheckCircle2 className="w-3 h-3" /> Passed</>
                                                ) : (
                                                    <><XCircle className="w-3 h-3" /> Failed</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    {new Date(attempt.submitted_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {new Date(attempt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/student/results/${attempt.id}`}
                                                className="inline-flex items-center gap-2 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                View Report
                                            </Link>
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
