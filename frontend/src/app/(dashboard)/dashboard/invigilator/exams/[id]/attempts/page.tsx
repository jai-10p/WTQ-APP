"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    ChevronLeft,
    Users,
    Trophy,
    Search,
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    UserCheck,
    Clock,
    AlertTriangle,
    Ban,
    RotateCcw
} from 'lucide-react';

import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import clsx from 'clsx';

export default function ExamAttemptsPage() {
    const params = useParams();
    const examId = params.id;
    const { showToast } = useToast();

    const [exam, setExam] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [designationFilter, setDesignationFilter] = useState('all');

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

    const filteredAttempts = attempts.filter(attempt => {
        const matchesSearch =
            attempt.student?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            attempt.student?.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'passed' ? (attempt.result?.is_passed && attempt.status !== 'disqualified') :
                statusFilter === 'disqualified' ? attempt.status === 'disqualified' :
                    (!attempt.result?.is_passed && attempt.status !== 'disqualified'));

        const matchesDesignation = designationFilter === 'all' ||
            attempt.student?.designation === designationFilter;

        return matchesSearch && matchesStatus && matchesDesignation;
    });

    const exportToCSV = () => {
        const headers = ['Rank', 'Username', 'Email', 'Designation', 'Score (%)', 'Points', 'Status', 'Date'];
        const csvRows = filteredAttempts.map((attempt, index) => [
            index + 1,
            attempt.student?.username,
            attempt.student?.email,
            attempt.student?.designation || 'N/A',
            attempt.result?.percentage,
            `${attempt.result?.total_score}/${attempt.result?.max_score}`,
            attempt.status === 'disqualified' ? 'Disqualified' : (attempt.result?.is_passed ? 'Passed' : 'Failed'),
            new Date(attempt.submitted_at).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `results_${exam?.exam_title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAllowResume = async (attemptId: number) => {
        try {
            setLoading(true);
            await api.post(`/exams/attempts/${attemptId}/allow-resume`);
            showToast('Student is now allowed to resume the exam', 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update student status', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {

        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
                <p className="text-gray-500 font-medium tracking-tight">Loading exam results...</p>
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
                            Exam: <span className="text-green-600 font-bold">{exam?.exam_title}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-bold text-gray-700">{attempts.length} Finished</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-bold text-gray-700">
                            {attempts.filter(a => a.result?.is_passed).length} Qualified
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        <div className="relative min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="disqualified">Disqualified</option>
                        </select>
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-600"
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
                        >
                            <option value="all">All Designations</option>
                            <option value="QA">QA</option>
                            <option value="DEV">DEV</option>
                            <option value="UI/UX">UI/UX</option>
                        </select>
                    </div>

                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-bold shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Rank</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Performance</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Submitted</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAttempts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">
                                        <UserCheck className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                        No results match your current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredAttempts.map((attempt, index) => (
                                    <tr key={attempt.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs mx-auto",
                                                index === 0 ? "bg-yellow-50 text-yellow-600 border border-yellow-200" :
                                                    index === 1 ? "bg-slate-50 text-slate-500 border border-slate-200" :
                                                        index === 2 ? "bg-orange-50 text-orange-600 border border-orange-200" :
                                                            "text-gray-400 border border-transparent"
                                            )}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-700 font-bold text-xs uppercase shadow-sm">
                                                    {attempt.student?.username.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{attempt.student?.username}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{attempt.student?.designation || 'General'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={clsx(
                                                    "text-sm font-bold",
                                                    attempt.status === 'disqualified' ? "text-gray-400 line-through" :
                                                        attempt.result?.is_passed ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {attempt.status === 'disqualified' ? "0.00%" : `${attempt.result?.percentage}%`}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">
                                                    {attempt.result?.total_score} / {attempt.result?.max_score} Pts
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {attempt.status === 'disqualified' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-zinc-900 text-white border border-zinc-800 shadow-sm animate-pulse">
                                                    <Ban className="w-3 h-3" />
                                                    Disqualified
                                                </span>
                                            ) : (
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                                    attempt.result?.is_passed ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                                )}>
                                                    {attempt.result?.is_passed ? "Pass" : "Fail"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-900 font-bold">
                                                    {new Date(attempt.submitted_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(attempt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {attempt.status === 'disqualified' && (
                                                    <button
                                                        onClick={() => handleAllowResume(attempt.id)}
                                                        className="inline-flex items-center gap-2 text-[10px] font-bold text-green-600 hover:text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg transition-all uppercase tracking-widest"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        Allow Resume
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/dashboard/student/results/${attempt.id}`}
                                                    className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg transition-all uppercase tracking-widest"
                                                >
                                                    Full Report
                                                </Link>
                                            </div>
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
