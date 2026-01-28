import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, color = "blue" }: StatsCardProps) {
    const colorClasses = {
        blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
        green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
        purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
        orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{title}</p>
                    <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">{trend}</span>
                    <span className="text-gray-400 dark:text-zinc-500 ml-2">vs last month</span>
                </div>
            )}
        </div>
    );
}
