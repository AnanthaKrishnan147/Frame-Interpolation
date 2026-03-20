import React, { useState } from 'react';
import { Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Frame, SelectionRange } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface ExportControlsProps {
    frames: Frame[];
    isGenerating: boolean;
    selectionRange: SelectionRange | null;
}

const ExportControls: React.FC<ExportControlsProps> = ({ frames, isGenerating, selectionRange }) => {
    const [isExportingVideo, setIsExportingVideo] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const getTargetFrames = () => {
        if (!selectionRange) return frames;
        return frames.slice(selectionRange.start, selectionRange.end + 1);
    };

    const exportFrames = async () => {
        const targetFrames = getTargetFrames();
        if (targetFrames.length === 0) return;

        // Simple way to download multiple files without ZIP for now
        targetFrames.forEach((frame, index) => {
            const link = document.createElement('a');
            link.href = frame.url;
            link.download = `frame_${String(index + 1).padStart(4, '0')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const renderVideo = async (fps: number) => {
        const targetFrames = getTargetFrames();
        if (targetFrames.length === 0) return;

        setIsExportingVideo(true);
        setExportProgress(0);

        try {
            const ffmpeg = new FFmpeg();

            ffmpeg.on('progress', ({ progress }) => {
                setExportProgress(Math.round(progress * 100));
            });

            await ffmpeg.load({
                coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
                wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
            });

            // Write files to virtual FS
            for (let i = 0; i < targetFrames.length; i++) {
                const frameData = await fetchFile(targetFrames[i].url);
                await ffmpeg.writeFile(`frame_${String(i).padStart(4, '0')}.png`, frameData);
            }

            // Run FFmpeg to encode video
            await ffmpeg.exec([
                '-framerate', String(fps),
                '-i', 'frame_%04d.png',
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                'output.mp4'
            ]);

            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([data as any], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `animation_${fps}fps.mp4`;
            a.click();

        } catch (error) {
            console.error('Error rendering video:', error);
            alert('Failed to render video.');
        } finally {
            setIsExportingVideo(false);
            setExportProgress(0);
        }
    };

    return (
        <div className="flex items-center space-x-3">
            <button
                onClick={exportFrames}
                disabled={frames.length === 0 || isGenerating}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hidden md:flex"
                title={selectionRange ? `Export Range (${selectionRange.start}-${selectionRange.end})` : 'Export All Frames'}
            >
                <ImageIcon size={18} />
                <span className="truncate">{selectionRange ? 'Export Selection' : 'Export Frames'}</span>
            </button>

            <div className="relative group">
                <button
                    disabled={frames.length === 0 || isGenerating || isExportingVideo}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectionRange ? `Render Range (${selectionRange.start}-${selectionRange.end})` : 'Render All Frames'}
                >
                    {isExportingVideo ? <Loader2 size={18} className="animate-spin" /> : <Film size={18} />}
                    <span className="truncate">{isExportingVideo ? `Rendering ${exportProgress}%` : (selectionRange ? 'Render Selection' : 'Render Video')}</span>
                </button>

                {/* Dropdown for FPS Selection */}
                {!isExportingVideo && frames.length > 0 && !isGenerating && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-gray border border-slate-200 dark:border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <div className="flex flex-col">
                            <button onClick={() => renderVideo(24)} className="text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm text-slate-700 dark:text-white transition-colors">24 FPS</button>
                            <button onClick={() => renderVideo(30)} className="text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm text-slate-700 dark:text-white border-t border-slate-100 dark:border-white/5 transition-colors">30 FPS</button>
                            <button onClick={() => renderVideo(60)} className="text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm text-slate-700 dark:text-white border-t border-slate-100 dark:border-white/5 transition-colors">60 FPS</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportControls;
