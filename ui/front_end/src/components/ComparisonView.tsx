import React from 'react';

interface ComparisonViewProps {
    originalFrame: string | null;
    generatedFrame: string | null;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ originalFrame, generatedFrame }) => {
    if (!originalFrame || !generatedFrame) return null;

    return (
        <div className="absolute inset-0 z-10 flex border-2 border-slate-300 dark:border-white/10 rounded-lg overflow-hidden shadow-2xl bg-slate-100 dark:bg-black">
            <div className="w-1/2 relative border-r border-slate-300 dark:border-white/20">
                <div className="absolute top-2 left-2 px-2 py-1 bg-white/80 dark:bg-black/60 backdrop-blur text-xs font-bold text-slate-800 dark:text-white rounded shadow-sm">
                    Original Keyframe
                </div>
                <img src={originalFrame} className="w-full h-full object-cover" alt="Original" />
            </div>
            <div className="w-1/2 relative border-l border-slate-300 dark:border-white/20">
                <div className="absolute top-2 right-2 px-2 py-1 bg-neon-purple/80 backdrop-blur text-xs font-bold text-white rounded shadow-[0_0_10px_rgba(140,82,255,0.8)]">
                    AI Generated
                </div>
                <img src={generatedFrame} className="w-full h-full object-cover" alt="AI Generated" />
            </div>
        </div>
    );
};

export default ComparisonView;
