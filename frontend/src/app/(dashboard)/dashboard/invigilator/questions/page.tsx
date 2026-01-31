"use client";

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    HelpCircle,
    Loader2,
    Database,
    Play,
    Terminal,
    Edit,
    Trash2,
    X,
    Code,
    AlertTriangle
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function QuestionsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);


    const [formData, setFormData] = useState({
        question_text: '',
        difficulty: 'medium',
        question_type: 'mcq',
        category: 'QA',
        reference_solution: '',
        database_schema: '',
        options: [
            { option_text: '', is_correct: true, display_order: 1 },
            { option_text: '', is_correct: false, display_order: 2 },
            { option_text: '', is_correct: false, display_order: 3 },
            { option_text: '', is_correct: false, display_order: 4 },
        ],
        test_cases: [{ input: '', expected_output: '' }],
        image_url: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const removeImage = (index: number) => {
        try {
            if (formData.image_url.startsWith('[')) {
                const images = JSON.parse(formData.image_url);
                images.splice(index, 1);
                setFormData(prev => ({
                    ...prev,
                    image_url: images.length > 0 ? JSON.stringify(images) : ''
                }));
            } else {
                // If it was a single string, just clear it
                setFormData(prev => ({ ...prev, image_url: '' }));
            }
        } catch (e) {
            console.error('Failed to remove image:', e);
            setFormData(prev => ({ ...prev, image_url: '' }));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

        const files = e.target.files;
        if (!files || files.length === 0) return;

        console.log('🖼️ Upload started:', files.length, 'file(s)');
        const uploadFormData = new FormData();

        try {
            // For SQL questions, always use the multiple upload endpoint
            if (formData.question_type === 'sql') {
                // Get existing images
                let existingImages: string[] = [];
                if (formData.image_url) {
                    try {
                        if (formData.image_url.startsWith('[')) {
                            existingImages = JSON.parse(formData.image_url);
                        } else {
                            existingImages = [formData.image_url];
                        }
                    } catch (e) {
                        console.warn('Failed to parse existing images:', e);
                    }
                }

                // Calculate how many more images we can add (max 3 total)
                const remainingSlots = 3 - existingImages.length;
                if (remainingSlots <= 0) {
                    showToast('Maximum 3 images allowed. Please clear existing images first.', 'warning');
                    e.target.value = '';
                    return;
                }

                Array.from(files).slice(0, remainingSlots).forEach(file => {
                    console.log('📎 Adding file:', file.name, file.size, 'bytes');
                    uploadFormData.append('images', file);
                });

                console.log('📡 Posting to /questions/upload-images...');
                const response: any = await api.post('/questions/upload-images', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                console.log('✅ Upload response:', response.data);

                const newImageUrls = response.data.data.image_urls;
                const allImages = [...existingImages, ...newImageUrls];

                setFormData(prev => ({ ...prev, image_url: JSON.stringify(allImages) }));
                showToast(`${newImageUrls.length} image(s) added (${allImages.length} total)`, 'success');
            } else {
                // For other question types (if ever needed), use single upload
                uploadFormData.append('image', files[0]);
                const response: any = await api.post('/questions/upload-image', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormData(prev => ({ ...prev, image_url: response.data.data.image_url }));
                showToast('Image uploaded', 'success');
            }
        } catch (error: any) {
            console.error('❌ Upload error:', error);
            console.error('Error response:', error.response?.data);
            showToast(error.response?.data?.message || 'Upload failed', 'error');
        } finally {
            // Reset input to allow re-uploading the same file
            e.target.value = '';
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
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
            newOptions.forEach((opt, i) => opt.is_correct = i === index);
        } else {
            (newOptions[index] as any)[field] = value;
        }
        setFormData({ ...formData, options: newOptions });
    };

    const handleTestCaseChange = (index: number, field: 'input' | 'expected_output', value: string) => {
        const newTestCases = [...formData.test_cases];
        newTestCases[index][field] = value;
        setFormData({ ...formData, test_cases: newTestCases });
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            test_cases: [...formData.test_cases, { input: '', expected_output: '' }]
        });
    };

    const removeTestCase = (index: number) => {
        if (formData.test_cases.length <= 1) return;
        const newTestCases = formData.test_cases.filter((_, i) => i !== index);
        setFormData({ ...formData, test_cases: newTestCases });
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if ((formData.question_type === 'mcq' || formData.question_type === 'statement') && formData.options.some(opt => !opt.option_text.trim())) {
            showToast('Please fill in all option texts', 'warning');
            return;
        }

        const dataToSave: any = { ...formData };

        // Prepare data based on type
        if (formData.question_type === 'coding') {
            dataToSave.reference_solution = JSON.stringify({ test_cases: formData.test_cases });
            // Remove options for coding questions
            delete dataToSave.options;
            delete dataToSave.test_cases;
        } else if (formData.question_type === 'sql' || formData.question_type === 'output') {
            // SQL and output questions don't have options or test_cases
            delete dataToSave.options;
            delete dataToSave.test_cases;
        } else {
            // MCQ and statement questions don't have test_cases
            delete dataToSave.test_cases;
        }

        // For SQL questions, if image_url is cleared, set it to null so the backend updates it
        if (formData.question_type === 'sql' && (!formData.image_url || formData.image_url === '')) {
            dataToSave.image_url = null;
        } else if (formData.question_type !== 'sql') {
            // For non-SQL types, we don't use images yet, so keep it clean
            delete dataToSave.image_url;
        }


        console.log('💾 Saving question:', dataToSave);
        console.log('💾 Question type:', dataToSave.question_type);
        console.log('💾 Has options?', 'options' in dataToSave);
        console.log('💾 Has test_cases?', 'test_cases' in dataToSave);
        console.log('💾 Has image_url?', 'image_url' in dataToSave, dataToSave.image_url);

        try {
            setIsSaving(true);
            if (editingQuestion) {
                await api.put(`/questions/${editingQuestion.id}`, dataToSave);
                showToast('Question updated successfully!', 'success');
            } else {
                await api.post('/questions', dataToSave);
                showToast('Question created successfully!', 'success');
            }
            setIsModalOpen(false);
            setEditingQuestion(null);
            resetForm();
            fetchInitialData();
        } catch (error: any) {
            console.error('❌ Save error:', error);
            console.error('Error response:', error.response?.data);
            if (error.response?.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
            }
            const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Failed to save question';
            showToast(errorMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };


    const resetForm = () => {
        setFormData({
            question_text: '',
            difficulty: 'medium',
            question_type: 'mcq',
            category: 'QA',
            reference_solution: '',
            database_schema: '',
            options: [
                { option_text: '', is_correct: true, display_order: 1 },
                { option_text: '', is_correct: false, display_order: 2 },
                { option_text: '', is_correct: false, display_order: 3 },
                { option_text: '', is_correct: false, display_order: 4 },
            ],
            test_cases: [{ input: '', expected_output: '' }],
            image_url: ''
        });
    };

    const handleTypeChange = (type: string) => {
        const newData = { ...formData, question_type: type };
        if (type === 'statement') {
            newData.options = [
                { option_text: 'True', is_correct: true, display_order: 1 },
                { option_text: 'False', is_correct: false, display_order: 2 }
            ];
        } else if (type === 'coding') {
            newData.options = [];
            newData.test_cases = [{ input: '', expected_output: '' }];
        } else if (type === 'mcq' && newData.options.length < 4) {
            newData.options = [
                { option_text: '', is_correct: true, display_order: 1 },
                { option_text: '', is_correct: false, display_order: 2 },
                { option_text: '', is_correct: false, display_order: 3 },
                { option_text: '', is_correct: false, display_order: 4 },
            ];
        }

        setFormData(newData);
    };

    const handleEditClick = (q: any) => {
        setEditingQuestion(q);
        let testCases = [{ input: '', expected_output: '' }];

        if (q.question_type === 'coding' && q.reference_solution) {
            try {
                const parsed = JSON.parse(q.reference_solution);
                testCases = parsed.test_cases || testCases;
            } catch (e) {
                console.error('Failed to parse test cases', e);
            }
        }

        setFormData({
            question_text: q.question_text,
            difficulty: q.difficulty,
            question_type: q.question_type || 'mcq',
            category: q.category || 'QA',
            reference_solution: q.reference_solution || '',
            database_schema: q.database_schema || '',
            options: q.options?.map((opt: any) => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                display_order: opt.display_order
            })) || [],
            test_cases: testCases,
            image_url: q.image_url || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteQuestion = (id: number) => {
        setDeletingId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingId || isSaving) return;
        try {
            setIsSaving(true);
            await api.delete(`/questions/${deletingId}`);
            showToast('Question deleted successfully!', 'success');
            setShowDeleteModal(false);
            setDeletingId(null);
            fetchInitialData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete question', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.question_text?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
        const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
        const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
        return matchesSearch && matchesCategory && matchesDifficulty && matchesType;
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
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        Add Question
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FOR:</span>
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="QA">QA</option>
                                <option value="DEV">DEV</option>
                                <option value="UI/UX">UI/UX</option>
                                <option value="General">General</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Difficulty:</span>
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white"
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type:</span>
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="mcq">MCQ</option>
                                <option value="sql">SQL</option>
                                <option value="output">Output</option>
                                <option value="statement">Statement</option>
                                <option value="coding">Coding</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Question</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">For</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Loading question bank...</p>
                                    </td>
                                </tr>
                            ) : filteredQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium">
                                        No questions match your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuestions.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                                                    <HelpCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 line-clamp-2">{q.question_text}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                                                {q.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                                ${q.difficulty === 'hard' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                    q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded w-fit">
                                                {q.question_type === 'sql' && <Database className="w-3 h-3 text-blue-500" />}
                                                {q.question_type === 'coding' && <Terminal className="w-3 h-3 text-green-500" />}
                                                {q.question_type === 'output' && <Play className="w-3 h-3 text-purple-500" />}
                                                {q.question_type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleEditClick(q)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{editingQuestion ? 'Modify Question' : 'Create New Question'}</h2>
                            <button onClick={() => { setIsModalOpen(false); setEditingQuestion(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-8 space-y-8">

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 bg-white"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="QA">QA</option>
                                        <option value="DEV">DEV</option>
                                        <option value="UI/UX">UI/UX</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Difficulty</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 bg-white"
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Type</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 bg-white"
                                        value={formData.question_type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                    >
                                        <option value="mcq">MCQ</option>
                                        <option value="sql">SQL Query</option>
                                        <option value="output">Output</option>
                                        <option value="statement">Statement</option>
                                        <option value="coding">Coding</option>
                                    </select>
                                </div>
                            </div>

                            {/* Image Upload Section - Only for SQL Questions */}
                            {formData.question_type === 'sql' && (
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Question Images (Optional - Up to 3 images supported)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all text-sm font-medium text-gray-600 shadow-sm">
                                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                            </div>
                                            <span>Upload Images</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                        {formData.image_url && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                className="text-xs text-red-500 font-bold hover:underline"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    {formData.image_url && (
                                        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            {(() => {
                                                try {
                                                    if (formData.image_url.startsWith('[')) {
                                                        const images = JSON.parse(formData.image_url);
                                                        return images.map((url: string, idx: number) => (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={getMediaUrl(url)}
                                                                    alt=""
                                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 transition-all group-hover:opacity-75"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeImage(idx)}
                                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ));
                                                    }
                                                } catch (e) { }

                                                // Fallback for single image string
                                                return (
                                                    <div className="relative group">
                                                        <img
                                                            src={getMediaUrl(formData.image_url)}
                                                            alt=""
                                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}


                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Question Text</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Enter the question description here..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] font-medium"
                                    value={formData.question_text}
                                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                />
                            </div>

                            {/* Options for MCQ/Statement */}
                            {(formData.question_type === 'mcq' || formData.question_type === 'statement') && (
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Answer Options</label>
                                    {formData.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-4 items-center group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="radio"
                                                    name="correct"
                                                    checked={opt.is_correct}
                                                    onChange={() => handleOptionChange(idx, 'is_correct', true)}
                                                    className="w-5 h-5 text-blue-600 border-2 border-gray-200 focus:ring-offset-0 focus:ring-transparent"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder={`Option ${idx + 1}`}
                                                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                                                value={opt.option_text}
                                                onChange={(e) => handleOptionChange(idx, 'option_text', e.target.value)}
                                                readOnly={formData.question_type === 'statement'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* SQL Fields */}
                            {formData.question_type === 'sql' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">
                                            <Database className="w-4 h-4" />
                                            Database Schema (Setup SQL)
                                        </label>
                                        <textarea
                                            className="w-full border border-blue-200 rounded-xl px-4 py-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[150px]"
                                            placeholder="CREATE TABLE users (id INT, name VARCHAR(50)); ..."
                                            value={formData.database_schema}
                                            onChange={(e) => setFormData({ ...formData, database_schema: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reference SQL Solution</label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50 min-h-[100px]"
                                            placeholder="SELECT * FROM users WHERE id = 1;"
                                            value={formData.reference_solution}
                                            onChange={(e) => setFormData({ ...formData, reference_solution: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Output Question Fields */}
                            {formData.question_type === 'output' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                            <Code className="w-4 h-4" />
                                            Code Snippet (Visible to Student)
                                        </label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-zinc-900 text-zinc-100 min-h-[150px]"
                                            value={formData.database_schema}
                                            onChange={(e) => setFormData({ ...formData, database_schema: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Expected Output String</label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                                            rows={2}
                                            value={formData.reference_solution}
                                            onChange={(e) => setFormData({ ...formData, reference_solution: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Coding Fields - Test Cases */}
                            {formData.question_type === 'coding' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Test Cases</label>
                                        <button
                                            type="button"
                                            onClick={addTestCase}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Case
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.test_cases.map((tc, idx) => (
                                            <div key={idx} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/30 relative group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Case #{idx + 1}</span>
                                                    {formData.test_cases.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTestCase(idx)}
                                                            className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Input (stdin)</label>
                                                        <textarea
                                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows={2}
                                                            placeholder="(empty for no input)"
                                                            value={tc.input}
                                                            onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Expected Output</label>
                                                        <textarea
                                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows={2}
                                                            value={tc.expected_output}
                                                            onChange={(e) => handleTestCaseChange(idx, 'expected_output', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">

                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => { setIsModalOpen(false); setEditingQuestion(null); }}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-10 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-bold disabled:bg-blue-400 disabled:shadow-none flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{editingQuestion ? 'Updating...' : 'Creating...'}</span>
                                        </>
                                    ) : (
                                        <>{editingQuestion ? 'Update' : 'Create'} Question</>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">DELETE QUESTION?</h2>
                        <p className="text-sm text-gray-500 mb-8 font-medium">
                            This will permanently delete the question from the question bank and all associated exams.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold text-sm flex items-center justify-center gap-2 disabled:bg-red-400"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

