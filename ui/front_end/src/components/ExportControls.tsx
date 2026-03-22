import React, { useState } from 'react';
import { Film, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Frame, SelectionRange } from '../types';
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
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas 2D context not available");

            // Load first image to get dimensions
            const firstImg = new Image();
            await new Promise((resolve, reject) => {
                firstImg.onload = resolve;
                firstImg.onerror = reject;
                firstImg.src = targetFrames[0].url;
            });

            canvas.width = firstImg.width;
            canvas.height = firstImg.height;

            // Stream creation - force specific framerate
            const stream = canvas.captureStream(fps);
            let options = { mimeType: 'video/webm' };
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                options = { mimeType: 'video/webm; codecs=vp9' };
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                options = { mimeType: 'video/mp4' };
            }

            const recorder = new MediaRecorder(stream, options);
            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);

            const recordingPromise = new Promise<void>((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: options.mimeType.split(';')[0] });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    
                    const extension = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
                    a.download = `animation_${fps}fps.${extension}`;
                    a.click();
                    resolve();
                };
            });

            recorder.start();

            // Play frames on canvas in real-time
            for (let i = 0; i < targetFrames.length; i++) {
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = targetFrames[i].url;
                });

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                setExportProgress(Math.round(((i + 1) / targetFrames.length) * 100));

                // Wait for one frame duration to let the MediaRecorder capture it
                await new Promise(r => setTimeout(r, 1000 / fps));
            }

            recorder.stop();
            await recordingPromise;

        } catch (error) {
            console.error('Error rendering video:', error);
            alert('Failed to generate video.');
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
                    onClick={() => renderVideo(24)}
                    disabled={frames.length === 0 || isGenerating || isExportingVideo}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectionRange ? `Download Range (${selectionRange.start}-${selectionRange.end})` : 'Download All Frames'}
                >
                    {isExportingVideo ? <Loader2 size={18} className="animate-spin" /> : <Film size={18} />}
                    <span className="truncate">{isExportingVideo ? `Downloading ${exportProgress}%` : (selectionRange ? 'Download Selection' : 'Download Video')}</span>
                </button>
            </div>
        </div>
    );
};

export default ExportControls;
