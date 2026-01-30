"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CountdownTimer } from '@/components/CountdownTimer';
import { QuestionPalette } from '@/components/QuestionPalette';
import { QuestionCard } from '@/components/QuestionCard';
import { ChevronRight, ChevronLeft, AlertTriangle, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function ExamPage() {
    const params = useParams();
    const attemptId = params.id;
    const router = useRouter();
    const { showToast } = useToast();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({}); // exam_question_id -> selected_option_id OR sql_text
    const [metadatas, setMetadatas] = useState<Record<number, any>>({}); // exam_question_id -> metadata (like selected language)
    const [questions, setQuestions] = useState<any[]>([]);
    const [examTitle, setExamTitle] = useState('');
    const [remainingTime, setRemainingTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

    useEffect(() => {
        if (attemptId) {
            fetchExamData();
        }
    }, [attemptId]);

    const fetchExamData = async () => {
        try {
            setLoading(true);
            const response: any = await api.get(`/student/attempts/${attemptId}/questions`);
            const data = response.data.data;

            setQuestions(data.questions);
            setExamTitle(data.exam_title);
            setRemainingTime(data.remaining_time);

            // Map existing answers if any
            const existingAnswers: Record<number, any> = {};
            const existingMetadatas: Record<number, any> = {};
            data.questions.forEach((q: any) => {
                if (q.answer) {
                    existingAnswers[q.id] = q.answer.selected_option_id || q.answer.answer_text;
                    existingMetadatas[q.id] = q.answer.metadata;
                }
            });
            setAnswers(existingAnswers);
            setMetadatas(existingMetadatas);
        } catch (error: any) {
            console.error('Failed to fetch exam questions:', error);
            showToast(error.response?.data?.message || 'Failed to load exam. Redirecting to dashboard.', 'error');
            router.push('/dashboard/student/exams');
        } finally {
            setLoading(false);
        }
    };

    const saveAnswer = async (examQuestionId: number, optionId?: number, sqlText?: string, metadata?: any) => {
        try {
            await api.post(`/student/attempts/${attemptId}/answer`, {
                exam_question_id: examQuestionId,
                selected_option_id: optionId,
                answer_text: sqlText,
                metadata: metadata
            });
        } catch (error) {
            console.error('Failed to auto-save answer:', error);
        }
    };

    const handleOptionSelect = (optionId: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));

        // Auto-save API call
        saveAnswer(currentQuestion.id, optionId);
    };

    const handleSqlChange = (sql: string) => {
        const currentQuestion = questions[currentQuestionIndex];
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: sql
        }));

        // Auto-save SQL answer
        saveAnswer(currentQuestion.id, undefined, sql, metadatas[currentQuestion.id]);
    };

    const handleMetadataChange = (metadata: any) => {
        const currentQuestion = questions[currentQuestionIndex];
        setMetadatas((prev) => ({
            ...prev,
            [currentQuestion.id]: metadata
        }));

        // Auto-save with metadata
        saveAnswer(currentQuestion.id, undefined, answers[currentQuestion.id], metadata);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to finish and submit your exam?")) return;

        try {
            setSubmitting(true);
            await api.post(`/student/attempts/${attemptId}/submit`);
            setShowSuccessOverlay(true);
            setTimeout(() => {
                router.push('/dashboard/student/exams');
            }, 3500);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to submit exam', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTimeout = useCallback(() => {
        const autoSubmit = async () => {
            try {
                await api.post(`/student/attempts/${attemptId}/submit`);
                setShowSuccessOverlay(true);
                setTimeout(() => {
                    router.push('/dashboard/student/exams');
                }, 3500);
            } catch (error) {
                console.error('Auto-submit failed:', error);
                router.push('/dashboard/student/exams');
            }
        };
        autoSubmit();
    }, [attemptId, router]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading your exam paper...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">No questions found</h2>
                <button onClick={() => router.push('/dashboard/student/exams')} className="mt-4 text-blue-600 font-medium hover:underline">
                    Back to Exams
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const answeredIndices = questions
        .map((q, idx) => (answers[q.id] ? idx : -1))
        .filter((idx) => idx !== -1);

    return (
        <div className="flex h-screen flex-col bg-gray-50 relative">
            {showSuccessOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-green-600/90 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="text-center text-white scale-in-center animate-in zoom-in duration-500">
                        <div className="bg-white/20 p-8 rounded-full inline-block mb-8 relative">
                            <CheckCircle className="w-24 h-24 text-white" />
                            <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-yellow-300 animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black mb-4 tracking-tight">EXAM SUBMITTED!</h1>
                        <p className="text-2xl font-bold opacity-90 mb-8 uppercase tracking-[0.2em]">Great Work! GOOD LUCK.</p>
                        <div className="flex items-center justify-center gap-2 text-white/70 font-medium text-lg">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redirecting to your dashboard...
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">{examTitle}</h1>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium border border-blue-100">
                        In Progress
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Time Remaining</p>
                        <CountdownTimer initialSeconds={remainingTime} onTimeout={handleTimeout} />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit Exam
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8 flex justify-center">
                    <div className="w-full max-w-3xl">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                    Points: {currentQuestion.question_weightage}
                                </span>
                            </div>

                            <QuestionCard
                                question={currentQuestion.question}
                                selectedOptionId={typeof answers[currentQuestion.id] === 'number' ? answers[currentQuestion.id] : undefined}
                                onOptionSelect={handleOptionSelect}
                                sqlAnswer={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                                onSqlChange={handleSqlChange}
                                metadata={metadatas[currentQuestion.id]}
                                onMetadataChange={handleMetadataChange}
                            />
                        </div>

                        <div className="flex items-center justify-between mt-8">
                            <button
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold shadow-md transition-all"
                                >
                                    Finish & Submit
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md transition-all"
                                >
                                    Next Question
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6 flex flex-col shadow-inner">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-900">Question Palette</h3>
                    </div>

                    <div className="flex-1">
                        <QuestionPalette
                            totalQuestions={questions.length}
                            currentQuestionIndex={currentQuestionIndex}
                            answeredIndices={answeredIndices}
                            onSelect={setCurrentQuestionIndex}
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Legend</h4>
                        <div className="grid grid-cols-1 gap-3 text-xs">
                            <div className="flex items-center gap-3 font-medium text-gray-600">
                                <div className="w-3.5 h-3.5 rounded bg-blue-600"></div>
                                <span>Current Question</span>
                            </div>
                            <div className="flex items-center gap-3 font-medium text-gray-600">
                                <div className="w-3.5 h-3.5 rounded bg-green-100 border border-green-200"></div>
                                <span>Answered</span>
                            </div>
                            <div className="flex items-center gap-3 font-medium text-gray-600">
                                <div className="w-3.5 h-3.5 rounded bg-gray-100"></div>
                                <span>Not Visited</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            Don't forget to submit before the timer expires. Your progress is saved as you navigate.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
