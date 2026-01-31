"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, Loader2, Download, Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';

import api from '@/services/api';
import { useToast } from '@/context/ToastContext';

export default function UsersPage() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [designationFilter, setDesignationFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ username: '', email: '', role: 'student', password: '', designation: 'QA', is_active: true });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [isBulkSaving, setIsBulkSaving] = useState(false);
    const [bulkResults, setBulkResults] = useState<any>(null);



    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response: any = await api.get('/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesDesignation = designationFilter === 'all' || user.designation === designationFilter;

        return matchesSearch && matchesRole && matchesDesignation;
    });

    const exportToCSV = () => {
        const headers = ['Username', 'Email', 'Role', 'Designation', 'Status', 'Joined At'];
        const csvRows = filteredUsers.map(user => [
            user.username,
            user.email,
            user.role,
            user.designation || '-',
            user.is_active ? 'Active' : 'Inactive',
            new Date(user.created_at).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetForm = () => {
        setFormData({ username: '', email: '', role: 'student', password: '', designation: 'QA', is_active: true });

        setIsEditMode(false);
        setCurrentUserId(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            if (isEditMode && currentUserId) {
                await api.put(`/users/${currentUserId}`, formData);
                showToast(`User updated successfully!`, 'success');
            } else {
                await api.post('/auth/register', formData);
                showToast(`User created successfully!`, 'success');
            }
            resetForm();
            fetchUsers();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    const handleEditClick = (user: any) => {
        setFormData({
            username: user.username,
            email: user.email,
            role: user.role,
            password: '',
            designation: user.designation || 'QA',
            is_active: user.is_active
        });

        setCurrentUserId(user.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (id: number) => {
        setDeletingId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingId || isSaving) return;
        try {
            setIsSaving(true);
            await api.delete(`/users/${deletingId}`);
            setUsers(users.filter(u => u.id !== deletingId));
            showToast('User deleted successfully', 'success');
            setShowDeleteModal(false);
            setDeletingId(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete user', 'error');
            // Close modal even on error so they can take the suggested action (deactivate)
            setShowDeleteModal(false);
            setDeletingId(null);
        } finally {
            setIsSaving(false);
        }
    };


    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkFile) return;

        const formData = new FormData();
        formData.append('file', bulkFile);

        try {
            setIsBulkSaving(true);
            const response: any = await api.post('/auth/bulk-register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setBulkResults(response.data.data);
            showToast('Bulk registration process completed!', 'success');
            fetchUsers();
            // Don't close immediately if there are errors to show
            if (response.data.data.failed === 0) {
                setTimeout(() => {
                    setIsBulkModalOpen(false);
                    setBulkResults(null);
                    setBulkFile(null);
                }, 2000);
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Bulk upload failed', 'error');
        } finally {
            setIsBulkSaving(false);
        }
    };


    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage system administrators, invigilators, and students.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => { setBulkResults(null); setBulkFile(null); setIsBulkModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Upload className="w-4 h-4" />
                        Add Bulk Students
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>

                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Filters:</span>
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="invigilator">Invigilator</option>
                            <option value="student">Student</option>
                        </select>
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
                        >
                            <option value="all">All Designations</option>
                            <option value="QA">QA</option>
                            <option value="DEV">DEV</option>
                            <option value="UI/UX">UI/UX</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined At</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
                                        <p className="text-gray-500 mt-2">Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs uppercase">
                                                    {user.username.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'invigilator' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {user.role || 'student'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {user.designation || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
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

                {/* Pagination placeholder */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                    <span>Showing 1 to {filteredUsers.length} of {filteredUsers.length} results</span>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                        <button disabled className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditMode && '(Leave blank to keep current)'}</label>
                                    <input
                                        type="password"
                                        required={!isEditMode}
                                        minLength={6}
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="student">Student</option>
                                        <option value="invigilator">Invigilator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    >
                                        <option value="QA">QA</option>
                                        <option value="DEV">DEV</option>
                                        <option value="UI/UX">UI/UX</option>
                                    </select>
                                </div>
                                {isEditMode && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Account Status</p>
                                            <p className="text-xs text-gray-500">{formData.is_active ? 'User can log in' : 'User access is blocked'}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                )}
                            </div>


                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => resetForm()}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                                        </>
                                    ) : (
                                        isEditMode ? 'Update User' : 'Create User'
                                    )}
                                </button>
                            </div>


                        </form>
                    </div>
                </div >
            )
            }

            {/* Custom Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">DELETE USER?</h2>
                            <p className="text-sm text-gray-500 mb-8 font-medium">
                                This action cannot be undone. All user data and access will be permanently revoked.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 disabled:bg-red-400 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                )
            }
            {/* Bulk Upload Modal */}
            {
                isBulkModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <FileUp className="w-8 h-8 text-blue-600" />
                                    BULK STUDENT IMPORT
                                </h2>
                                <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <Plus className="w-8 h-8 rotate-45" />
                                </button>
                            </div>

                            {!bulkResults ? (
                                <form onSubmit={handleBulkSubmit} className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Important Instructions
                                        </h4>
                                        <ul className="text-xs text-blue-600 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                                            <li>File must be either <strong>.csv</strong> or <strong>.xlsx</strong> format.</li>
                                            <li>Required columns: <strong>username</strong>, <strong>email</strong>.</li>
                                            <li>Optional: <strong>designation</strong> (QA, DEV, UI/UX), <strong>role</strong> (default: student).</li>
                                            <li>Password will be automatically set to: <code>10Pearls_username</code></li>
                                        </ul>
                                    </div>

                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group relative">
                                        <input
                                            type="file"
                                            accept=".csv, .xlsx, .xls"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                            required
                                        />
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-700 mb-1">
                                                {bulkFile ? bulkFile.name : 'Click to select or drag & drop'}
                                            </p>
                                            <p className="text-xs text-gray-400">CSV or Excel files only (max 5MB)</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            disabled={isBulkSaving}
                                            onClick={() => setIsBulkModalOpen(false)}
                                            className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!bulkFile || isBulkSaving}
                                            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isBulkSaving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Processing File...</span>
                                                </>
                                            ) : (
                                                'Start Bulk Upload'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-center">
                                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Success</p>
                                            <p className="text-3xl font-black text-green-700">{bulkResults.success}</p>
                                        </div>
                                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center">
                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Failed</p>
                                            <p className="text-3xl font-black text-red-700">{bulkResults.failed}</p>
                                        </div>
                                    </div>

                                    {bulkResults.errors.length > 0 && (
                                        <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Error Details</h4>
                                            {bulkResults.errors.map((err: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-red-600 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                                    {err}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setIsBulkModalOpen(false); setBulkResults(null); }}
                                        className="w-full py-4 bg-gray-900 text-white font-black rounded-xl hover:bg-black transition-all shadow-xl active:scale-95"
                                    >
                                        Close Results
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

