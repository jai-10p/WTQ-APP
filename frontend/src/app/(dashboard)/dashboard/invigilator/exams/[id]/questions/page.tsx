"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Plus,
    Trash2,
    Search,
    ChevronLeft,
    Loader2,
    GripVertical,
    FileQuestion,
    Filter
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
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

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
                api.get('/questions')
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
        const newAssignment = {
            question_id: question.id,
            question_weightage: 5,
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
            const existing = assignedQuestions.find(q => q.question_id === questionId);
            await api.post(`/exams/${examId}/questions`, {
                questions: [{
                    question_id: questionId,
                    question_weightage: weightage,
                    question_order: existing.question_order
                }]
            });
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

    const filteredAvailable = availableQuestions.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
        const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
        const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
        return matchesSearch && matchesCategory && matchesDifficulty && matchesType && !isAssigned(q.id);
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium tracking-tight">Loading exam questions...</p>
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
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                Total Pts: {Math.round(assignedQuestions.reduce((sum, q) => sum + parseFloat(q.question_weightage), 0))}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {assignedQuestions.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                        <FileQuestion className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <h3 className="text-gray-900 font-bold">No questions assigned</h3>
                                    <p className="text-gray-400 text-sm mt-1">Add questions from the bank on the right.</p>
                                </div>
                            ) : (
                                assignedQuestions.map((aq, index) => (
                                    <div key={aq.id} className="p-6 flex items-start gap-4 hover:bg-gray-50/50 transition-colors group">
                                        <div className="mt-1 text-gray-300">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-gray-900 font-semibold leading-relaxed">
                                                        {aq.question?.question_text}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                                                            {aq.question?.category}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            Type: {aq.question?.question_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(aq.question_id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="mt-4 flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weightage:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                                        value={Math.round(aq.question_weightage)}
                                                        onChange={(e) => handleUpdateWeightage(aq.question_id, parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order:</span>
                                                    <span className="text-sm font-bold text-gray-900"># {aq.question_order}</span>
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
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-green-600" />
                            Question Bank
                        </h3>

                        <div className="space-y-3 mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">Any Category</option>
                                    <option value="QA">QA</option>
                                    <option value="DEV">DEV</option>
                                    <option value="UI/UX">UI/UX</option>
                                    <option value="General">General</option>
                                </select>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                >
                                    <option value="all">Any Difficulty</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="all">Any Type</option>
                                    <option value="mcq">MCQ</option>
                                    <option value="sql">SQL</option>
                                    <option value="output">Output</option>
                                    <option value="statement">Statement</option>
                                    <option value="coding">Coding</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {filteredAvailable.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-xs font-medium">No available questions found.</p>
                            ) : (
                                filteredAvailable.map((q) => (
                                    <div key={q.id} className="p-4 border border-gray-50 rounded-lg hover:border-blue-100 hover:bg-blue-50/50 transition-all group">
                                        <p className="text-xs text-gray-700 font-semibold line-clamp-2 mb-3">
                                            {q.question_text}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                                                    {q.category}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase
                                                    ${q.difficulty === 'hard' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                    {q.difficulty}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase">
                                                    {q.question_type}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleAssign(q)}
                                                disabled={saving}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all flex items-center gap-1 uppercase tracking-wider"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <Link
                                href="/dashboard/invigilator/questions"
                                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 py-3 rounded-lg transition-all uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Plus className="w-3 h-3" />
                                Create New
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
