import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 w-64">
            <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow pb-4">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8c52ff" strokeWidth="8" opacity="0.3" />
                    <circle
                        cx="50" cy="50" r="40" fill="transparent"
                        stroke="#5271ff" strokeWidth="8"
                        strokeDasharray="250" strokeDashoffset={250 - (250 * progress) / 100}
                        className="transition-all duration-300"
                        transform="rotate(-90 50 50)"
                    />
                </svg>
            </div>
            <p className="text-neon-purple font-bold text-lg animate-pulse pb-2 mt-4">Generating frames...</p>

            <div className="w-full bg-slate-200 dark:bg-white/10 h-3 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-purple-blue transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-sm font-mono text-slate-600 dark:text-white/70">{Math.round(progress)}%</p>
        </div>
    );
};

export default ProgressBar;
