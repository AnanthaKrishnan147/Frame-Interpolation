import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import type { Frame } from '../types';

interface GeneratedFramesPreviewProps {
    frames: Frame[];
}

export default function GeneratedFramesPreview({ frames }: GeneratedFramesPreviewProps) {
    const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);

    // If no frames, don't render the section
    if (!frames || frames.length === 0) return null;

    return (
        <div className="w-full bg-slate-50 dark:bg-[#0a0a0e] border-t border-slate-200 dark:border-white/10 p-6 flex flex-col shrink-0">
            <div className="flex items-center space-x-2 mb-4">
                <div className="w-1 h-4 bg-neon-purple rounded-full" />
                <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Generated Frames Preview</h2>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-white/60">
                    {frames.length}
                </span>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13141a]/50 p-4 custom-scrollbar">
                <div className="flex gap-4 w-max">
                    {frames.map((frame, index) => (
                        <div
                            key={frame.id}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                            onClick={() => setSelectedFrame(frame)}
                        >
                            {/* Thumbnail Container */}
                            <div className="relative w-32 h-24 sm:w-40 sm:h-30 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(140,82,255,0.3)] group-hover:border-neon-purple/50 bg-black/10 dark:bg-black/40">
                                <img
                                    src={frame.url}
                                    alt={`Frame ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform">
                                        <Maximize2 size={16} />
                                    </div>
                                </div>

                                {/* Ribbon for Keyframes */}
                                {frame.isKeyframe && (
                                    <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-neon-purple text-white text-[8px] font-black uppercase tracking-wider rounded backdrop-blur-md shadow-sm">
                                        Key
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <span className="text-xs font-bold text-slate-600 dark:text-white/60 group-hover:text-neon-purple transition-colors">
                                Frame {index + 1}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fullscreen Preview Modal */}
            {selectedFrame && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedFrame(null)}
                >
                    <div
                        className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center gap-4 bg-[#13141a] border border-white/10 shadow-2xl rounded-2xl p-2 sm:p-4"
                        onClick={e => e.stopPropagation()} // Prevent click from closing modal
                    >
                        {/* Modal Header */}
                        <div className="w-full flex items-center justify-between px-2 text-white">
                            <div className="flex items-center space-x-3">
                                <h3 className="font-bold">
                                    Frame Preview
                                </h3>
                                {selectedFrame.isKeyframe && (
                                    <span className="px-2 py-0.5 bg-neon-purple text-white text-xs font-black uppercase tracking-wider rounded-md">
                                        Keyframe
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedFrame(null)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Image */}
                        <div className="w-full flex-1 overflow-hidden rounded-xl border border-white/5 bg-black/50 flex items-center justify-center min-h-[50vh]">
                            <img
                                src={selectedFrame.url}
                                alt="Enlarged Frame"
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
