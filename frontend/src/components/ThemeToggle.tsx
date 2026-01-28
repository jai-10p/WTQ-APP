"use client";

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import clsx from 'clsx';

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={clsx(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2",
                theme === 'dark' ? "bg-zinc-600" : "bg-gray-200",
                className
            )}
            aria-label="Toggle Theme"
        >
            <span className="sr-only">Use setting</span>
            <span
                className={clsx(
                    "pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center",
                    theme === 'dark' ? "translate-x-5" : "translate-x-0"
                )}
            >
                <Sun
                    className={clsx(
                        "absolute h-3.5 w-3.5 text-amber-500 transition-opacity duration-200",
                        theme === 'dark' ? "opacity-0" : "opacity-100"
                    )}
                />
                <Moon
                    className={clsx(
                        "absolute h-3.5 w-3.5 text-blue-500 transition-opacity duration-200",
                        theme === 'dark' ? "opacity-100" : "opacity-0"
                    )}
                />
            </span>
        </button>
    );
}
