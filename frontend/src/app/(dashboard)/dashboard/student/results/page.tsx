"use client";

import { useState, useEffect } from 'react';
import { Award, Calendar, CheckCircle, XCircle, ChevronRight, Loader2, BarChart3 } from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';

export default function StudentResultsPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response: any = await api.get('/student/results');
            setResults(response.data.data.results);
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
                <p className="text-gray-500 mt-1">Review your performance across all completed assessments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Average Score</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {results.length > 0
                                ? Math.round(results.reduce((acc, curr) => acc + (curr.result?.percentage || 0), 0) / results.length)
                                : 0}%
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Exams Taken</p>
                        <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Pass Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {results.length > 0
                                ? Math.round((results.filter(r => r.result?.is_passed).length / results.length) * 100)
                                : 0}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Taken</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                        <p className="text-gray-500 mt-2 font-medium">Loading your results...</p>
                                    </td>
                                </tr>
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        You haven't completed any exams yet.
                                    </td>
                                </tr>
                            ) : (
                                results.map((attempt) => (
                                    <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{attempt.exam?.exam_title}</p>
                                            <p className="text-xs text-gray-400">Passing Score: {attempt.exam?.passing_score}%</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(attempt.submitted_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {attempt.result?.total_score} / {attempt.result?.max_score}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {Math.round(attempt.result?.percentage)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {attempt.result?.is_passed ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Passed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircle className="w-3 h-3" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/student/results/${attempt.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                            >
                                                View Report
                                                <ChevronRight className="w-4 h-4" />
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
