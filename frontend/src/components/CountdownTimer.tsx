"use client";

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    initialSeconds: number;
    onTimeout: () => void;
}

export function CountdownTimer({ initialSeconds, onTimeout }: CountdownTimerProps) {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) {
            onTimeout();
            return;
        }

        const timer = setInterval(() => {
            setSeconds((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds, onTimeout]);

    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const secs = time % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isUrgent = seconds < 300; // Less than 5 mins

    return (
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg border ${isUrgent ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(seconds)}
        </div>
    );
}
