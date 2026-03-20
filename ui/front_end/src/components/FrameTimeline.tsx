import React, { useRef, useEffect } from 'react';
import type { Frame } from '../types';

interface FrameTimelineProps {
    frames: Frame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: (index: number) => void;
}

const FrameTimeline: React.FC<FrameTimelineProps> = ({ frames, currentFrameIndex, setCurrentFrameIndex }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto scroll timeline to keep active frame in view
        if (containerRef.current) {
            const el = containerRef.current.children[currentFrameIndex] as HTMLElement;
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentFrameIndex]);

    // Handle drag to scrub feature
    const handleDragScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons === 1) { // Left mouse button held down
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const widthPerItem = 136; // 32w (128px) + 8px space
            const newIndex = Math.floor(x / widthPerItem);

            if (newIndex >= 0 && newIndex < frames.length) {
                setCurrentFrameIndex(newIndex);
            }
        }
    };

    return (
        <div
            className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4 flex items-center space-x-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent select-none cursor-ew-resize relative"
            onMouseMove={handleDragScrub}
            ref={containerRef}
        >
            {frames.length > 0 ? (
                frames.map((frame, idx) => (
                    <div
                        key={frame.id}
                        onClick={() => setCurrentFrameIndex(idx)}
                        className={`relative flex-shrink-0 w-32 h-20 rounded-lg border-2 transition-all cursor-pointer overflow-hidden pointer-events-none ${currentFrameIndex === idx
                            ? 'border-slate-800 dark:border-white scale-105 z-10 shadow-lg'
                            : frame.isKeyframe
                                ? 'border-neon-purple/40 opacity-70 hover:opacity-100'
                                : 'border-neon-blue/40 opacity-50 hover:opacity-100'
                            }`}
                    >
                        <img src={frame.url} className="w-full h-full object-cover" alt={`T-${idx}`} draggable="false" />
                        <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${frame.isKeyframe ? 'bg-neon-purple text-white' : 'bg-neon-blue text-white'
                            }`}>
                            {frame.isKeyframe ? 'Key' : `F${idx}`}
                        </div>
                    </div>
                ))
            ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/5 rounded-xl pointer-events-none">
                    <span className="text-slate-400 dark:text-white/10 font-mono text-sm">TIMELINE EMPTY</span>
                </div>
            )}
        </div>
    );
};

export default FrameTimeline;
