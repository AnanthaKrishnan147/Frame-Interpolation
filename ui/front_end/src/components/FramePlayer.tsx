import React, { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { Frame } from '../types';
import ComparisonView from './ComparisonView';
import ProgressBar from './ProgressBar';

interface FramePlayerProps {
    frames: Frame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;
    isPlaying: boolean;
    playbackSpeed: number;
    zoom: number;
    isGenerating: boolean;
    showComparison: boolean;
    onionSkinEnabled?: boolean;
}

const FramePlayer: React.FC<FramePlayerProps> = ({
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    isPlaying,
    playbackSpeed,
    zoom,
    isGenerating,
    showComparison,
    onionSkinEnabled = false
}) => {
    const requestRef = useRef<number>();
    const lastUpdateRef = useRef<number>(0);

    const playContainerRef = useRef<HTMLDivElement>(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (zoom <= 100) return;
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        setPanOffset(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
        }));

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // Reset pan if zoom becomes <= 100%
    useEffect(() => {
        if (zoom <= 100) {
            setPanOffset({ x: 0, y: 0 });
        }
    }, [zoom]);

    const animate = (time: number) => {
        if (frames.length > 0) {
            const interval = 1000 / (24 * playbackSpeed); // Base 24fps
            if (time - lastUpdateRef.current > interval) {
                setCurrentFrameIndex(prev => (prev + 1) % frames.length);
                lastUpdateRef.current = time;
            }
        }
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, frames.length, playbackSpeed]);

    const currentFrame = frames[currentFrameIndex];
    const originalKeyframe = frames.find(f => f.isKeyframe)?.url || null; // Simplified for now

    return (
        <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden relative">
            <div
                className={`flex-1 flex items-center justify-center p-4 relative overflow-hidden ${zoom > 100 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div
                    ref={playContainerRef}
                    className="relative w-full max-w-4xl aspect-video rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-slate-200 dark:bg-[#1a1c23] border border-slate-300 dark:border-white/5 transition-transform origin-center"
                    style={{
                        transform: `scale(${zoom / 100}) translate(${panOffset.x / (zoom / 100)}px, ${panOffset.y / (zoom / 100)}px)`,
                        width: '100%',
                        maxWidth: '800px',
                        aspectRatio: '16/9'
                    }}
                >
                    {isGenerating && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-lg border border-neon-purple/30">
                            <ProgressBar progress={70} /> {/* Mock progress */}
                        </div>
                    )}

                    {frames.length > 0 ? (
                        <>
                            {showComparison && !currentFrame.isKeyframe ? (
                                <ComparisonView
                                    originalFrame={originalKeyframe}
                                    generatedFrame={currentFrame.url}
                                />
                            ) : (
                                <div className="relative w-full h-full rounded-lg shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-black">
                                    {/* Onion Skin - Previous Frame (Reddish tint conceptually, or just opacity) */}
                                    {onionSkinEnabled && currentFrameIndex > 0 && !isPlaying && (
                                        <img
                                            src={frames[currentFrameIndex - 1].url}
                                            className="absolute inset-0 w-full h-full object-cover opacity-25"
                                            alt="Previous Frame Onion Skin"
                                        />
                                    )}

                                    {/* Current Frame */}
                                    <img
                                        src={currentFrame.url}
                                        className="relative z-10 w-full h-full object-cover"
                                        alt={`Frame ${currentFrameIndex}`}
                                    />

                                    {/* Onion Skin - Next Frame (Greenish tint conceptually, or just opacity) */}
                                    {onionSkinEnabled && currentFrameIndex < frames.length - 1 && !isPlaying && (
                                        <img
                                            src={frames[currentFrameIndex + 1].url}
                                            className="absolute inset-0 z-20 w-full h-full object-cover opacity-25"
                                            alt="Next Frame Onion Skin"
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-gray/20 border-2 border-dashed border-slate-300 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/20">
                                <Upload size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 dark:text-white/40 font-medium px-4">Upload keyframes to begin interpolation</p>
                                <p className="text-slate-400 dark:text-white/20 text-sm mt-2">Professional AI-assisted 2D Motion Synthesis</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FramePlayer;
