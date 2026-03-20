import React, { useRef, useState } from 'react';
import type { Frame, Layer, SelectionRange } from '../../types';

interface FrameGridProps {
    frames: Frame[];
    layers: Layer[];
    currentFrameIndex: number;
    timelineZoom: number;
    selectionRange: SelectionRange | null;
    setSelectionRange: React.Dispatch<React.SetStateAction<SelectionRange | null>>;
    timelineWidth: number;
}

const FrameGrid: React.FC<FrameGridProps> = ({
    frames,
    layers,
    currentFrameIndex,
    timelineZoom,
    selectionRange,
    setSelectionRange,
    timelineWidth
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragStartFrame, setDragStartFrame] = useState<number | null>(null);

    const getFrameIndexFromEvent = (e: React.PointerEvent) => {
        if (!containerRef.current || frames.length === 0) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        return Math.min(
            frames.length - 1,
            Math.floor((x / Math.max(rect.width, 1)) * frames.length)
        );
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.target instanceof HTMLButtonElement) return; // ignore explicit buttons
        const frameIndex = getFrameIndexFromEvent(e);
        setDragStartFrame(frameIndex);
        setSelectionRange(null); // Clear previous selection
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (dragStartFrame !== null) {
            const currentFrame = getFrameIndexFromEvent(e);
            if (currentFrame !== dragStartFrame) {
                setSelectionRange({
                    start: Math.min(dragStartFrame, currentFrame),
                    end: Math.max(dragStartFrame, currentFrame)
                });
            } else {
                // Still on the same frame, maybe it's just a click
                setSelectionRange(null);
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDragStartFrame(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Using a fixed base width that scales with zoom
    const baseFrameWidth = 16 * (timelineZoom / 100);

    return (
        <div
            ref={containerRef}
            className="flex flex-col flex-1 relative cursor-crosshair min-h-[100px]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Selection Overlay */}
            {selectionRange && frames.length > 0 && (
                <div
                    className="absolute top-0 bottom-0 bg-neon-purple/20 border-l border-r border-neon-purple/50 z-0 pointer-events-none"
                    style={{
                        left: `${selectionRange.start * baseFrameWidth}px`,
                        width: `${((selectionRange.end - selectionRange.start) + 1) * baseFrameWidth}px`
                    }}
                />
            )}

            {layers.map(layer => (
                <div key={layer.id} className={`h-16 flex items-center border-b border-slate-200/50 dark:border-white/5 relative ${!layer.isVisible ? 'opacity-20' : ''}`}>
                    {/* Background grid lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px)', backgroundSize: `${baseFrameWidth}px 100%` }} />

                    {/* Render Frame Blocks for the Track */}
                    {frames.map((frame, idx) => {
                        let isVisibleOnTrack = false;
                        let barColorClass = '';

                        if (layer.type === 'keyframes' && frame.isKeyframe) {
                            isVisibleOnTrack = true;
                            barColorClass = 'bg-neon-purple border-neon-purple shadow-[0_0_10px_rgba(140,82,255,0.6)]';
                        } else if (layer.type === 'generated' && !frame.isKeyframe) {
                            isVisibleOnTrack = true;
                            barColorClass = 'bg-neon-blue/80 border-neon-blue shadow-[0_0_8px_rgba(82,113,255,0.4)]';
                        } else if (layer.type === 'preview') {
                            // The preview track simply shows all frames as a single contiguous block series
                            isVisibleOnTrack = true;
                            barColorClass = frame.isKeyframe ? 'bg-slate-400 dark:bg-white/40' : 'bg-slate-300 dark:bg-white/20';
                        }

                        if (!isVisibleOnTrack) return null;

                        const isSelected = idx === currentFrameIndex;

                        return (
                            <div
                                key={`${layer.id}-${frame.id}`}
                                className={`absolute top-2 bottom-2 border opacity-90 rounded-[2px] overflow-hidden ${barColorClass} 
                  ${isSelected ? 'border-2 border-white opacity-100 z-10' : ''}
                `}
                                style={{
                                    left: `${idx * baseFrameWidth}px`,
                                    width: `${baseFrameWidth - 1}px`
                                }}
                            >
                                {/* Thumbnails in preview track if enough zoom width */}
                                {layer.type === 'preview' && baseFrameWidth > 30 && (
                                    <img src={frame.url} className="w-full h-full object-cover opacity-50 absolute inset-0 mix-blend-overlay" draggable="false" alt="" />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default FrameGrid;
