"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, HelpCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function QuestionsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);

    const [formData, setFormData] = useState({
        question_text: '',
        difficulty: 'medium',
        weightage: 1,
        question_type: 'mcq',
        reference_solution: '',
        database_schema: '',
        options: [
            { option_text: '', is_correct: true, display_order: 1 },
            { option_text: '', is_correct: false, display_order: 2 },
            { option_text: '', is_correct: false, display_order: 3 },
            { option_text: '', is_correct: false, display_order: 4 },
        ]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const response: any = await api.get('/questions');
            setQuestions(response.data.data.questions);
        } catch (error) {
            console.error('Failed to fetch questions data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (index: number, field: string, value: any) => {
        const newOptions = [...formData.options];
        if (field === 'is_correct' && value === true) {
            // Radio-like behavior for single correct answer (though backend supports multiple)
            newOptions.forEach((opt, i) => opt.is_correct = i === index);
        } else {
            (newOptions[index] as any)[field] = value;
        }
        setFormData({ ...formData, options: newOptions });
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (formData.question_type === 'mcq' && formData.options.some(opt => !opt.option_text.trim())) {
            showToast('Please fill in all option texts', 'warning');
            return;
        }

        if (formData.question_type === 'sql' && !formData.reference_solution.trim()) {
            showToast('Please provide a reference solution', 'warning');
            return;
        }

        try {
            if (editingQuestion) {
                await api.put(`/questions/${editingQuestion.id}`, formData);
                showToast('Question updated successfully!', 'success');
            } else {
                await api.post('/questions', formData);
                showToast('Question created successfully!', 'success');
            }
            setIsModalOpen(false);
            setEditingQuestion(null);
            resetForm();
            fetchInitialData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to save question', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            question_text: '',
            difficulty: 'medium',
            weightage: 1,
            question_type: 'mcq',
            reference_solution: '',
            database_schema: '',
            options: [
                { option_text: '', is_correct: true, display_order: 1 },
                { option_text: '', is_correct: false, display_order: 2 },
                { option_text: '', is_correct: false, display_order: 3 },
                { option_text: '', is_correct: false, display_order: 4 },
            ]
        });
    };

    const handleEditClick = (q: any) => {
        setEditingQuestion(q);
        setFormData({
            question_text: q.question_text,
            difficulty: q.difficulty,
            weightage: q.weightage,
            question_type: q.question_type || 'mcq',
            reference_solution: q.reference_solution || '',
            database_schema: q.database_schema || '',
            options: q.options?.map((opt: any) => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                display_order: opt.display_order
            })) || [
                    { option_text: '', is_correct: true, display_order: 1 },
                    { option_text: '', is_correct: false, display_order: 2 },
                    { option_text: '', is_correct: false, display_order: 3 },
                    { option_text: '', is_correct: false, display_order: 4 },
                ]
        });
        setIsModalOpen(true);
    };

    const handleDeleteQuestion = async (id: number) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            await api.delete(`/questions/${id}`);
            showToast('Question deleted successfully!', 'success');
            fetchInitialData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete question', 'error');
        }
    };

    const filteredQuestions = questions.filter(q => {
        const searchLow = searchTerm.toLowerCase();
        return (
            q.question_text?.toLowerCase().includes(searchLow) ||
            q.difficulty?.toLowerCase().includes(searchLow)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
                    <p className="text-gray-500 mt-1">Manage your pool of examination questions.</p>
                </div>
                {user?.role === 'invigilator' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Question
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Question</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Options</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading questions...</p>
                                    </td>
                                </tr>
                            ) : filteredQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        No questions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuestions.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                                                    <HelpCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.question_text}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Weightage: {q.weightage}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${q.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                                    q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {q.question_type === 'sql' ? (
                                                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                    <Loader2 className="w-3 h-3" />
                                                    SQL Query
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex gap-1">
                                                        {q.options?.map((opt: any) => (
                                                            <div
                                                                key={opt.id}
                                                                title={opt.option_text}
                                                                className={`w-2 h-2 rounded-full ${opt.is_correct ? 'bg-green-500' : 'bg-gray-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1">{q.options?.length} Options</p>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(q)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                    title="Edit Question"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Question Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
                            <button onClick={() => { setIsModalOpen(false); setEditingQuestion(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid grid-cols-2 gap-4 col-span-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                        <select
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weightage</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            step="0.5"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                            value={formData.weightage || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, weightage: val === '' ? 0 : parseFloat(val) });
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={formData.question_type === 'mcq'}
                                                    onChange={() => setFormData({ ...formData, question_type: 'mcq' })}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm">Multiple Choice</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={formData.question_type === 'sql'}
                                                    onChange={() => setFormData({ ...formData, question_type: 'sql' })}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm">SQL Query</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                <textarea
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    placeholder="Enter the question text here..."
                                    value={formData.question_text}
                                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                />
                            </div>

                            {formData.question_type === 'mcq' ? (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Options (Mark the correct answer)</label>
                                    {formData.options.map((opt, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="correct_option"
                                                checked={opt.is_correct}
                                                onChange={() => handleOptionChange(index, 'is_correct', true)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <input
                                                type="text"
                                                required
                                                placeholder={`Option ${index + 1}`}
                                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                                value={opt.option_text}
                                                onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                                            />
                                            {opt.is_correct ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Database Schema (Initial SQL)</label>
                                        <p className="text-xs text-gray-500 mb-2">Provide CREATE TABLE and INSERT statements to setup the environment for this question.</p>
                                        <textarea
                                            required
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                                            placeholder="CREATE TABLE City (ID INT, Name VARCHAR(20)...); INSERT INTO City VALUES (1, 'New York'...);"
                                            value={formData.database_schema}
                                            onChange={(e) => setFormData({ ...formData, database_schema: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reference Solution (Correct SQL Query)</label>
                                        <textarea
                                            required
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                            placeholder="SELECT * FROM City WHERE Population > 100000;"
                                            value={formData.reference_solution}
                                            onChange={(e) => setFormData({ ...formData, reference_solution: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    {editingQuestion ? 'Update Question' : 'Save Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
