"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Clock,
    Award,
    BarChart3,
    Target,
    Loader2
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function ResultDetailPage() {
    const params = useParams();
    const attemptId = params.id;
    const router = useRouter();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isInvigilator = user?.role === 'invigilator' || user?.role === 'admin';

    useEffect(() => {
        if (attemptId) {
            fetchResult();
        }
    }, [attemptId]);

    const fetchResult = async () => {
        try {
            setLoading(true);
            const response: any = await api.get(`/student/attempts/${attemptId}/result`);
            setResult(response.data.data);
        } catch (error) {
            console.error('Failed to fetch result:', error);
            showToast('Failed to load exam results.', 'error');
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Calculating your final score...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.history.length > 1 ? window.history.back() : router.push('/dashboard')}
                    className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Exam Report</h1>
                    <p className="text-gray-500 mt-0.5">Performance breakdown and score analysis.</p>
                </div>
            </div>

            {/* Score Overview Card */}
            <div className={`rounded-2xl border p-8 shadow-sm overflow-hidden relative ${result.is_passed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${result.is_passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                            {result.is_passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {result.is_passed ? 'Passed' : 'Failed'}
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 leading-tight">
                            Your Score: {Math.round(result.percentage)}%
                        </h2>
                        <p className={`text-lg font-medium ${result.is_passed ? 'text-green-800' : 'text-red-800'}`}>
                            {result.is_passed
                                ? "Excellent work! You've successfully cleared this assessment."
                                : "You didn't meet the passing criteria this time. Keep practicing!"
                            }
                        </p>
                    </div>

                    <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 divide-x divide-gray-200">
                        <div className="px-6 text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Score</p>
                            <p className="text-2xl font-black text-gray-900">{result.total_score} <span className="text-gray-400 text-sm font-bold">/ {result.max_score}</span></p>
                        </div>
                        <div className="px-6 text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Correct</p>
                            <p className="text-2xl font-black text-gray-900">{result.correct_answers} <span className="text-gray-400 text-sm font-bold">/ {result.total_questions}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Question-wise Feedback
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {result.breakdown?.map((item: any, index: number) => (
                        <div key={index} className="p-6 flex items-start gap-4">
                            <div className={`mt-1 font-bold text-sm w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-gray-900 font-semibold leading-relaxed">
                                        {item.question_text}
                                    </p>
                                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
                                        <Target className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-600">{item.score}/{item.weightage}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className={`p-3 rounded-xl border ${item.is_correct
                                        ? 'bg-green-50/50 border-green-200'
                                        : 'bg-red-50/50 border-red-200'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            {item.is_correct ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                                            <span className={`text-sm font-semibold ${item.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                                                Your Answer:
                                            </span>
                                        </div>
                                        {item.question_type === 'sql' || item.question_type === 'output' || item.question_type === 'coding' ? (
                                            <div className="mt-2 font-mono text-xs p-3 bg-gray-900 text-emerald-400 rounded-lg overflow-x-auto whitespace-pre border border-gray-800 shadow-inner">
                                                {item.selected_option}
                                            </div>
                                        ) : (
                                            <span className={`text-sm font-bold ml-7 ${item.is_correct ? 'text-green-900' : 'text-red-900'}`}>
                                                {item.selected_option}
                                            </span>
                                        )}
                                    </div>
                                    {!item.is_correct && (
                                        <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                                            💡 Recommendation: Review the concepts related to this topic.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <button
                    onClick={() => isInvigilator ? window.history.back() : router.push('/dashboard/student/exams')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                    {isInvigilator ? 'Back to Exam Results' : 'Back to Available Exams'}
                </button>
            </div>
        </div>
    );
}
