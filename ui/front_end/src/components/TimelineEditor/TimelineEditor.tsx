import React, { useRef, useState, useEffect } from 'react';
import type { Frame, Marker, Layer } from '../../types';
import FrameLayerPanel from './FrameLayerPanel';
import MarkerManager from './MarkerManager';
import FrameGrid from './FrameGrid';
import PlayheadControl from './PlayheadControl';
import type { SelectionRange } from '../../types';

interface TimelineEditorProps {
    frames: Frame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: (idx: number) => void;
    markers: Marker[];
    setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>;
    layers: Layer[];
    setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
    timelineZoom: number;
    selectionRange: SelectionRange | null;
    setSelectionRange: React.Dispatch<React.SetStateAction<SelectionRange | null>>;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    markers,
    setMarkers,
    layers,
    setLayers,
    timelineZoom,
    selectionRange,
    setSelectionRange
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [timelineWidth, setTimelineWidth] = useState(0);

    // Auto scroll logic to keep playhead visible
    useEffect(() => {
        if (containerRef.current) {
            const scrollContainer = containerRef.current;
            const baseFrameWidth = 16 * (timelineZoom / 100);
            const playheadX = currentFrameIndex * baseFrameWidth;

            const viewportMid = scrollContainer.clientWidth / 2;

            if (playheadX > scrollContainer.scrollLeft + scrollContainer.clientWidth - 50 || playheadX < scrollContainer.scrollLeft + 50) {
                scrollContainer.scrollTo({
                    left: Math.max(0, playheadX - viewportMid),
                    behavior: 'smooth'
                });
            }
        }
    }, [currentFrameIndex, timelineZoom]);

    // Update total timeline width based on frames and zoom
    useEffect(() => {
        const baseFrameWidth = 16 * (timelineZoom / 100);
        setTimelineWidth(frames.length * baseFrameWidth);
    }, [frames.length, timelineZoom]);

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#13141a] select-none text-slate-800 dark:text-white">
            {/* Left panel for layer Management */}
            <FrameLayerPanel layers={layers} setLayers={setLayers} />

            {/* Right scrolling area for timeline tracks */}
            <div
                ref={containerRef}
                className="flex-1 overflow-x-auto overflow-y-hidden relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col"
            >
                <div
                    className="min-w-full flex flex-col relative"
                    style={{ width: `${Math.max(timelineWidth, 100)}px` }}
                >
                    {/* Top Marker Track */}
                    <MarkerManager
                        markers={markers}
                        setMarkers={setMarkers}
                        timelineWidth={timelineWidth}
                        totalFrames={frames.length}
                    />

                    {/* Main Grid Area containing the frame blocks */}
                    <div className="relative flex-1">
                        <FrameGrid
                            frames={frames}
                            layers={layers}
                            currentFrameIndex={currentFrameIndex}
                            timelineZoom={timelineZoom}
                            selectionRange={selectionRange}
                            setSelectionRange={setSelectionRange}
                            timelineWidth={timelineWidth}
                        />

                        {/* Playhead Scrubber overlay over all tracks */}
                        {frames.length > 0 && (
                            <PlayheadControl
                                currentFrameIndex={currentFrameIndex}
                                totalFrames={frames.length}
                                timelineWidth={timelineWidth}
                                onScrub={setCurrentFrameIndex}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineEditor;
