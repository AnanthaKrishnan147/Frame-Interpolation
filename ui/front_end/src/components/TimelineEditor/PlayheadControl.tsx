import React, { useRef } from 'react';

interface PlayheadControlProps {
    currentFrameIndex: number;
    totalFrames: number;
    timelineWidth: number;
    onScrub: (index: number) => void;
}

const PlayheadControl: React.FC<PlayheadControlProps> = ({
    currentFrameIndex,
    totalFrames,
    timelineWidth,
    onScrub
}) => {
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handleScrub(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (isDragging.current) {
            handleScrub(e.clientX);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleScrub = (clientX: number) => {
        if (!containerRef.current || totalFrames === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const newIndex = Math.min(
            totalFrames - 1,
            Math.floor((x / rect.width) * totalFrames)
        );
        if (newIndex >= 0 && newIndex !== currentFrameIndex) {
            onScrub(newIndex);
        }
    };

    const frameWidth = totalFrames > 0 ? timelineWidth / totalFrames : 0;
    const playheadPosition = `${(currentFrameIndex * frameWidth) + (frameWidth / 2)}px`;

    return (
        <div
            className="absolute inset-0 z-20 cursor-ew-resize min-h-[200px]"
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div
                className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none transform -translate-x-1/2 group"
                style={{ left: playheadPosition }}
            >
                {/* Playhead handle */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-neon-blue mt-8 shadow-[0_0_10px_rgba(82,113,255,0.8)] filter drop-shadow-md" />
                {/* Playhead line */}
                <div className="w-px h-full bg-neon-blue/80 shadow-[0_0_5px_rgba(82,113,255,0.8)]" />
            </div>
        </div>
    );
};

export default PlayheadControl;
