"use client";
// Triggering re-compile after folder rename

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Calendar, Clock, Loader2, BookOpen, ListPlus } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import clsx from 'clsx';

export default function ExamsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        exam_title: '',
        description: '',
        scheduled_start: '',
        scheduled_end: '',
        duration_minutes: 60,
        passing_score: 50,
        allowed_designations: [] as string[],
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const examsRes: any = await api.get('/exams');
            setExams(examsRes.data.data.exams);
        } catch (error) {
            console.error('Failed to fetch exams data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                allowed_designations: formData.allowed_designations.length > 0 ? formData.allowed_designations : null
            };

            if (editingExam) {
                await api.put(`/exams/${editingExam.id}`, payload);
                showToast('Exam updated successfully!', 'success');
            } else {
                await api.post('/exams', payload);
                showToast('Exam created successfully!', 'success');
            }
            setIsModalOpen(false);
            setEditingExam(null);
            resetForm();
            fetchInitialData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to save exam', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            exam_title: '',
            description: '',
            scheduled_start: '',
            scheduled_end: '',
            duration_minutes: 60,
            passing_score: 50,
            allowed_designations: (user?.role === 'invigilator' && user?.designation) ? [user.designation] : [],
        });
    };

    const handleEditClick = (exam: any) => {
        setEditingExam(exam);
        let designations: string[] = [];
        try {
            if (exam.allowed_designations) {
                designations = typeof exam.allowed_designations === 'string'
                    ? JSON.parse(exam.allowed_designations)
                    : exam.allowed_designations;
            }
        } catch (e) {
            console.error("Error parsing designations", e);
        }

        setFormData({
            exam_title: exam.exam_title,
            description: exam.description || '',
            scheduled_start: new Date(exam.scheduled_start).toISOString().slice(0, 16),
            scheduled_end: new Date(exam.scheduled_end).toISOString().slice(0, 16),
            duration_minutes: exam.duration_minutes,
            passing_score: exam.passing_score,
            allowed_designations: designations || [],
        });
        setIsModalOpen(true);
    };

    const handleDeleteExam = async (id: number) => {
        if (!confirm('Are you sure you want to delete this exam?')) return;
        try {
            await api.delete(`/exams/${id}`);
            showToast('Exam deleted successfully!', 'success');
            fetchInitialData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete exam', 'error');
        }
    };

    const toggleDesignation = (des: string) => {
        if (user?.role === 'invigilator') return; // Cannot change own designation
        setFormData(prev => {
            if (prev.allowed_designations.includes(des)) {
                return { ...prev, allowed_designations: prev.allowed_designations.filter(d => d !== des) };
            } else {
                return { ...prev, allowed_designations: [...prev.allowed_designations, des] };
            }
        });
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage your assessments.</p>
                </div>
                {user?.role === 'invigilator' && (
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Exam
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Access</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading exams...</p>
                                    </td>
                                </tr>
                            ) : filteredExams.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        No exams found.
                                    </td>
                                </tr>
                            ) : (
                                filteredExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/dashboard/invigilator/exams/${exam.id}/attempts`}
                                                        className="text-sm font-medium text-gray-900 border-b border-transparent hover:border-green-600 hover:text-green-600 transition-all"
                                                    >
                                                        {exam.exam_title}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 line-clamp-1">{exam.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(exam.scheduled_start).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(exam.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-600">
                                                {exam.allowed_designations ? (
                                                    // Parse if likely string, though backend might send obj if using JSON type, but here it's TEXT.
                                                    // Display limited
                                                    (() => {
                                                        try {
                                                            const parsed = typeof exam.allowed_designations === 'string' ? JSON.parse(exam.allowed_designations) : exam.allowed_designations;
                                                            return Array.isArray(parsed) ? parsed.join(', ') : 'All';
                                                        } catch { return 'All'; }
                                                    })()
                                                ) : 'All Students'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/invigilator/exams/${exam.id}/questions`}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                                    title="Manage Questions"
                                                >
                                                    <ListPlus className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleEditClick(exam)}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                                    title="Edit Exam"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExam(exam.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete Exam"
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

            {/* Create Exam Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 scrollbar-hide">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{editingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
                            <button onClick={() => { setIsModalOpen(false); setEditingExam(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveExam} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Enter exam title"
                                    value={formData.exam_title}
                                    onChange={(e) => setFormData({ ...formData, exam_title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none min-h-[80px]"
                                    placeholder="Brief description of the exam"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visible To (Designations)</label>
                                <div className="flex gap-4">
                                    {['QA', 'DEV', 'UI/UX'].map(des => (
                                        <label key={des} className={clsx(
                                            "flex items-center gap-2 cursor-pointer",
                                            user?.role === 'invigilator' && "opacity-60 cursor-not-allowed"
                                        )}>
                                            <input
                                                type="checkbox"
                                                checked={formData.allowed_designations.includes(des)}
                                                onChange={() => toggleDesignation(des)}
                                                disabled={user?.role === 'invigilator'}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700">{des}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Leave all unchecked to make visible to ALL students.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                    value={formData.duration_minutes || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, duration_minutes: val === '' ? 0 : parseInt(val) });
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                        value={formData.scheduled_start}
                                        onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled End</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                        value={formData.scheduled_end}
                                        onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                    value={formData.passing_score !== undefined && formData.passing_score !== null ? formData.passing_score : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, passing_score: val === '' ? 0 : parseInt(val) });
                                    }}
                                />
                            </div>

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
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                                >
                                    {editingExam ? 'Update Exam' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
