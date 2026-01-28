"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Plus,
    Trash2,
    Search,
    ChevronLeft,
    Loader2,
    Save,
    GripVertical,
    FileQuestion,
    CheckCircle2,
    X
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

export default function ExamQuestionsAssignmentPage() {
    const params = useParams();
    const examId = params.id;
    const router = useRouter();
    const { showToast } = useToast();

    const [exam, setExam] = useState<any>(null);
    const [assignedQuestions, setAssignedQuestions] = useState<any[]>([]);
    const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (examId) {
            fetchData();
        }
    }, [examId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [examRes, questionsRes, allQuestionsRes]: any = await Promise.all([
                api.get(`/exams/${examId}`),
                api.get(`/exams/${examId}/questions`),
                api.get('/questions') // Fetch all for adding
            ]);

            setExam(examRes.data.data);
            setAssignedQuestions(questionsRes.data.data.questions);
            setAvailableQuestions(allQuestionsRes.data.data.questions);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast('Failed to load exam data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (question: any) => {
        // Prepare data for assignment
        const newAssignment = {
            question_id: question.id,
            question_weightage: 1.0, // Default weightage
            question_order: assignedQuestions.length + 1
        };

        try {
            setSaving(true);
            await api.post(`/exams/${examId}/questions`, {
                questions: [newAssignment]
            });
            showToast('Question assigned successfully', 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to assign question', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (questionId: number) => {
        if (!confirm('Are you sure you want to remove this question from the exam?')) return;
        try {
            setSaving(true);
            await api.delete(`/exams/${examId}/questions/${questionId}`);
            showToast('Question removed successfully', 'success');
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to remove question', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateWeightage = async (questionId: number, weightage: number) => {
        try {
            // Find existing assignment to keep order
            const existing = assignedQuestions.find(q => q.question_id === questionId);
            await api.post(`/exams/${examId}/questions`, {
                questions: [{
                    question_id: questionId,
                    question_weightage: weightage,
                    question_order: existing.question_order
                }]
            });
            // Update local state for immediate feedback
            setAssignedQuestions(prev => prev.map(q =>
                q.question_id === questionId ? { ...q, question_weightage: weightage } : q
            ));
        } catch (error) {
            console.error('Failed to update weightage:', error);
        }
    };

    const isAssigned = (questionId: number) => {
        return assignedQuestions.some(aq => aq.question_id === questionId);
    };

    const filteredAvailable = availableQuestions.filter(q =>
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) && !isAssigned(q.id)
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading exam questions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/invigilator/exams"
                    className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Exam Questions</h1>
                    <p className="text-gray-500 mt-1">Exam: <span className="text-blue-600 font-semibold">{exam?.exam_title}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Questions */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <FileQuestion className="w-4 h-4 text-blue-600" />
                                Assigned Questions ({assignedQuestions.length})
                            </h2>
                            <div className="text-xs text-gray-500 font-medium">
                                Total Weightage: {assignedQuestions.reduce((sum, q) => sum + parseFloat(q.question_weightage), 0).toFixed(1)}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {assignedQuestions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileQuestion className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-gray-900 font-medium">No questions assigned yet</h3>
                                    <p className="text-gray-500 text-sm mt-1">Start by adding questions from the bank.</p>
                                </div>
                            ) : (
                                assignedQuestions.map((aq, index) => (
                                    <div key={aq.id} className="p-6 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="mt-1 text-gray-400">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="text-gray-900 font-medium leading-relaxed">
                                                    {aq.question?.question_text}
                                                </p>
                                                <button
                                                    onClick={() => handleRemove(aq.question_id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="mt-4 flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weightage:</span>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0.5"
                                                        className="w-16 px-2 py-1 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                        value={aq.question_weightage}
                                                        onChange={(e) => handleUpdateWeightage(aq.question_id, parseFloat(e.target.value))}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order:</span>
                                                    <span className="text-sm font-medium text-gray-900">{aq.question_order}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Questions Panel */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-600" />
                            Add from Question Bank
                        </h2>

                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                            {filteredAvailable.length === 0 ? (
                                <p className="text-center py-8 text-gray-500 text-sm">No available questions found matching your search.</p>
                            ) : (
                                filteredAvailable.map((q) => (
                                    <div key={q.id} className="p-3 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                        <p className="text-sm text-gray-700 font-medium line-clamp-2 mb-3">
                                            {q.question_text}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                                                {q.difficulty}
                                            </span>
                                            <button
                                                onClick={() => handleAssign(q)}
                                                disabled={saving}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:scale-105 transition-transform"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Question
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <Link
                                href="/dashboard/invigilator/questions"
                                className="text-sm text-gray-500 hover:text-blue-600 flex items-center justify-center gap-2 bg-gray-50 py-2 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Question
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
