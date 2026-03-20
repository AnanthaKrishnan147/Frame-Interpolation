import React from 'react';
import type { Marker } from '../../types';
import { Flag } from 'lucide-react';

interface MarkerManagerProps {
    markers: Marker[];
    setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>;
    timelineWidth: number;
    totalFrames: number;
}

const MarkerManager: React.FC<MarkerManagerProps> = ({ markers, setMarkers, timelineWidth, totalFrames }) => {
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (totalFrames === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const frameIndex = Math.floor((x / timelineWidth) * totalFrames);

        // Add new marker
        const newMarker: Marker = {
            id: `m-${Date.now()}`,
            frameIndex,
            label: `Mark ${markers.length + 1}`,
            color: '#8c52ff'
        };
        setMarkers(prev => [...prev, newMarker]);
    };

    const frameWidth = totalFrames > 0 ? timelineWidth / totalFrames : 0;

    return (
        <div
            className="h-8 border-b border-slate-200 dark:border-white/5 relative cursor-pointer hover:bg-white/5 transition-colors"
            onClick={handleTimelineClick}
            title="Click to add marker"
        >
            {/* Time ticks background (visual only) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px)', backgroundSize: '100px 100%' }} />

            {/* Markers */}
            {markers.map(marker => (
                <div
                    key={marker.id}
                    className="absolute top-1 flex flex-col items-center group transform -translate-x-1/2"
                    style={{ left: `${marker.frameIndex * frameWidth + frameWidth / 2}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Delete marker on click for now
                        setMarkers(prev => prev.filter(m => m.id !== marker.id));
                    }}
                >
                    <div className="flex items-center space-x-1 bg-slate-800 dark:bg-white dark:text-black text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute -top-1 -translate-y-full">
                        <span>{marker.label}</span>
                    </div>
                    <Flag size={12} style={{ color: marker.color, fill: marker.color }} className="drop-shadow-md cursor-pointer hover:scale-110 transition-transform" />
                </div>
            ))}
        </div>
    );
};

export default MarkerManager;
