"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Play, Loader2, Search, Filter, CheckCircle2, AlertTriangle, Ban, Info, ShieldCheck, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export default function StudentExamsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startingId, setStartingId] = useState<number | null>(null);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [instructionStep, setInstructionStep] = useState(1);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const response: any = await api.get('/student/exams');
            setExams(response.data.data.exams);
        } catch (error) {
            console.error('Failed to fetch student exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartClick = (exam: any) => {
        if (exam.attempt_status === 'in_progress') {
            // Resume immediately
            processStartExam(exam.id);
        } else {
            // Show instructions for new attempt
            setSelectedExam(exam);
            setInstructionStep(1);
            setShowInstructionsModal(true);
        }
    };

    const processStartExam = async (examId: number) => {
        try {
            setStartingId(examId);
            setShowInstructionsModal(false);
            const response: any = await api.post(`/student/exams/${examId}/start`);
            const { attempt_id } = response.data.data;
            router.push(`/exam/${attempt_id}`);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to start exam', 'error');
            setStartingId(null);
        }
    };

    const filteredExams = exams.filter(exam => {
        const searchLow = searchTerm.toLowerCase();
        return (
            exam.exam_title?.toLowerCase().includes(searchLow) ||
            exam.description?.toLowerCase().includes(searchLow)
        );
    });

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Available Exams</h1>
                <p className="text-gray-500 mt-1">Take your scheduled assessments and track your progress.</p>
            </div>

            <br />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                        <p className="text-gray-500 mt-4 font-medium">Fetching your exams...</p>
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-gray-300 text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No exams available</h3>
                        <p className="text-gray-500">Check back later for newly scheduled assessments.</p>
                    </div>
                ) : (
                    filteredExams.map((exam) => (
                        <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={exam.exam_title}>
                                    {exam.exam_title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                                    {exam.description || 'No description provided for this exam.'}
                                </p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>Starts: {new Date(exam.scheduled_start).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>Duration: {exam.duration_minutes} Minutes</span>
                                    </div>
                                    {exam.attempt_status === 'submitted' && (
                                        <div className="flex items-center gap-3 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            Exam Submitted
                                        </div>
                                    )}
                                    {exam.attempt_status === 'disqualified' && (
                                        <div className="flex items-center gap-3 text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm animate-bounce-short">
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                            Disqualified (Cheating Detected)
                                        </div>
                                    )}
                                </div>

                                {(() => {
                                    const now = new Date();
                                    const startTime = new Date(exam.scheduled_start);
                                    const endTime = new Date(exam.scheduled_end);
                                    const isNotStarted = now < startTime;
                                    const isEnded = now > endTime;

                                    if (['submitted', 'disqualified', 'abandoned', 'timeout'].includes(exam.attempt_status)) {
                                        const isDisqualified = exam.attempt_status === 'disqualified';
                                        return (
                                            <button
                                                disabled
                                                className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl cursor-not-allowed border 
                                                    ${isDisqualified
                                                        ? 'bg-red-50 text-red-500 border-red-100'
                                                        : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                                            >
                                                {isDisqualified ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {isDisqualified ? 'Disqualified' : 'Completed'}
                                            </button>
                                        );
                                    }

                                    if (isEnded) {
                                        return (
                                            <button
                                                disabled
                                                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-400 font-bold py-3 rounded-xl cursor-not-allowed border border-red-100"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Exam Ended
                                            </button>
                                        );
                                    }

                                    if (isNotStarted) {
                                        return (
                                            <button
                                                disabled
                                                className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-500 font-bold py-3 rounded-xl cursor-not-allowed border border-amber-100"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Not Started
                                            </button>
                                        );
                                    }

                                    return (
                                        <button
                                            onClick={() => handleStartClick(exam)}
                                            disabled={startingId === exam.id}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                                        >
                                            {startingId === exam.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 fill-current" />
                                                    {exam.attempt_status === 'in_progress' ? 'Resume Attempt' : 'Start Attempt'}
                                                </>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Instructions Modal */}
            {showInstructionsModal && selectedExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowInstructionsModal(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                        {instructionStep === 1 ? (
                            <>
                                <div className="bg-blue-600 p-8 text-white relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <ShieldCheck className="w-32 h-32" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                                        <Info className="w-8 h-8" />
                                        Exam Instructions
                                    </h2>
                                    <p className="text-blue-100 font-medium">Please read these rules carefully before starting <span className="text-white font-bold">"{selectedExam.exam_title}"</span>.</p>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                                <Ban className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-900 text-sm">Anti-Cheating</h4>
                                                <p className="text-xs text-red-700 mt-1 leading-relaxed">Tab switching or window minimizing is strictly prohibited. You will get ONE warning, then disqualification.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-amber-900 text-sm">Time Limit</h4>
                                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">The exam duration is <strong>{selectedExam.duration_minutes} minutes</strong>. The auto-timer starts as soon as you confirm.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                                <Zap className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-blue-900 text-sm">Action Items</h4>
                                                <p className="text-xs text-blue-700 mt-1 leading-relaxed">Copy-pasting of code or solutions is disabled. Focus on writing original logic.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-green-900 text-sm">Submission</h4>
                                                <p className="text-xs text-green-700 mt-1 leading-relaxed">Ensure all answers are saved before final submission. Review your progress in the navigation panel.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                <span>Use a stable internet connection throughout the exam.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                <span>You cannot retake the exam once it is submitted or disqualified.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-8 pt-0 flex gap-4">
                                    <button
                                        onClick={() => setShowInstructionsModal(false)}
                                        className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setInstructionStep(2)}
                                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-blue-600 p-8 text-white relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <BookOpen className="w-32 h-32" />
                                    </div>
                                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                                        <Play className="w-8 h-8" />
                                        Paper Pattern
                                    </h2>
                                    <p className="text-blue-100 font-medium">Review the format and pattern of <strong>"{selectedExam.exam_title}"</strong>.</p>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            General Guidelines:
                                        </h4>
                                        <ul className="space-y-4">
                                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-600">1</div>
                                                <span>The exam consists of multiple question types including MCQs, SQL Queries, and Coding challenges.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-600">2</div>
                                                <span>Each question may have different points based on its complexity and type.</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-gray-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-600">3</div>
                                                <span>You can skip and return to any question using the Question Palette on the right.</span>
                                            </li>
                                            <li className="flex items-start gap-4 text-sm text-gray-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-600">4</div>
                                                <span>For SQL and Coding questions, you can run your code multiple times to test results.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                        <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                            Once started, the timer cannot be paused. Closing the browser or losing connection will NOT pause the exam.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-8 pt-0 flex gap-4">
                                    <button
                                        onClick={() => setInstructionStep(1)}
                                        className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Back
                                    </button>
                                    <button
                                        onClick={() => processStartExam(selectedExam.id)}
                                        disabled={startingId === selectedExam.id}
                                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {startingId === selectedExam.id ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Initialising...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5 fill-current" />
                                                <span>I Understand, Start Exam</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
