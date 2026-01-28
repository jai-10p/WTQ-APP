"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Play, Loader2, Search, Filter } from 'lucide-react';
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

    const handleStartExam = async (examId: number) => {
        try {
            setStartingId(examId);
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

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by exam title..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

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
                                </div>

                                <button
                                    onClick={() => handleStartExam(exam.id)}
                                    disabled={startingId === exam.id}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                                >
                                    {startingId === exam.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            Start Attempt
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
