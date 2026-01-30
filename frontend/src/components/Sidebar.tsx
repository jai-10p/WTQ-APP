"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    Settings,
    LogOut,
    GraduationCap,
    ClipboardList,
} from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const menus = {
        admin: [
            { name: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard },
            { name: 'User Management', href: '/dashboard/super-admin/users', icon: Users },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ],
        invigilator: [
            { name: 'Dashboard', href: '/dashboard/invigilator', icon: LayoutDashboard },
            { name: 'Exams', href: '/dashboard/invigilator/exams', icon: FileText },
            { name: 'Questions', href: '/dashboard/invigilator/questions', icon: ClipboardList },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ],
        student: [
            { name: 'My Exams', href: '/dashboard/student/exams', icon: BookOpen },
        ],
    };

    const currentMenu = (menus as any)[user.role] || [];

    return (
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-30 transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">WTQ</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <div className="mb-4 px-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {user.role} Workspace
                    </p>
                </div>

                {currentMenu.map((item: any) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-green-50 dark:bg-zinc-800 text-green-700 dark:text-white"
                                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5", isActive ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-zinc-500")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 px-3 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-xs">
                        {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
