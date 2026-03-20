import React, { useState } from 'react';
import { Settings, ChevronUp, ChevronDown } from 'lucide-react';

interface InterpolationSettingsProps {
    targetFps: number;
    setTargetFps: (fps: number) => void;
    motionSmoothness: number;
    setMotionSmoothness: (smoothness: number) => void;
    aiMotionRefinement: boolean;
    setAiMotionRefinement: (refine: boolean) => void;
}

const InterpolationSettings: React.FC<InterpolationSettingsProps> = ({
    targetFps, setTargetFps,
    motionSmoothness, setMotionSmoothness,
    aiMotionRefinement, setAiMotionRefinement
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="glass-panel-dark">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center space-x-2">
                    <Settings size={18} className="text-slate-500 dark:text-white/60" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">Interpolation Settings</span>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-slate-600 dark:text-white" /> : <ChevronDown size={18} className="text-slate-600 dark:text-white" />}
            </button>

            {isExpanded && (
                <div className="p-4 space-y-5 border-t border-slate-200 dark:border-white/5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Target FPS</label>
                        <select
                            value={targetFps}
                            onChange={(e) => setTargetFps(Number(e.target.value))}
                            className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-purple transition-colors text-slate-800 dark:text-white"
                        >
                            <option value={24}>24 FPS</option>
                            <option value={30}>30 FPS</option>
                            <option value={60}>60 FPS</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Motion Smoothness</label>
                            <span className="text-xs font-mono text-slate-700 dark:text-white">{motionSmoothness}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={motionSmoothness}
                            onChange={(e) => setMotionSmoothness(Number(e.target.value))}
                            className="w-full accent-neon-blue"
                        />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                        <input
                            type="checkbox"
                            id="aiRefine"
                            checked={aiMotionRefinement}
                            onChange={(e) => setAiMotionRefinement(e.target.checked)}
                            className="w-4 h-4 accent-neon-purple rounded border-slate-300 dark:border-white/10"
                        />
                        <label htmlFor="aiRefine" className="text-sm text-slate-700 dark:text-white/70 select-none cursor-pointer">Enable AI Motion Refinement</label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterpolationSettings;
