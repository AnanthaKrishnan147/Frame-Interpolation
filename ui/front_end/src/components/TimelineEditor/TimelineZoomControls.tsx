import React from 'react';
import { Minus, Plus, Maximize } from 'lucide-react';

interface TimelineZoomControlsProps {
    timelineZoom: number;
    setTimelineZoom: (zoom: number | ((prev: number) => number)) => void;
}

const TimelineZoomControls: React.FC<TimelineZoomControlsProps> = ({ timelineZoom, setTimelineZoom }) => {
    return (
        <div className="flex items-center space-x-1 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-black/30 p-1">
            <button
                onClick={() => setTimelineZoom(prev => Math.max(50, prev - 20))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                title="Zoom Out"
            >
                <Minus size={14} />
            </button>
            <span className="text-[10px] font-mono w-8 text-center text-slate-700 dark:text-white/90">
                {Math.round(timelineZoom)}%
            </span>
            <button
                onClick={() => setTimelineZoom(prev => Math.min(500, prev + 20))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                title="Zoom In"
            >
                <Plus size={14} />
            </button>
            <div className="w-px h-3 bg-slate-300 dark:bg-white/10 mx-1" />
            <button
                onClick={() => setTimelineZoom(100)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded transition-colors text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                title="Fit/Reset Zoom"
            >
                <Maximize size={12} />
            </button>
        </div>
    );
};

export default TimelineZoomControls;
