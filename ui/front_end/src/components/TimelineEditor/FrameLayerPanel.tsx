import React from 'react';
import type { Layer } from '../../types';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';

interface FrameLayerPanelProps {
    layers: Layer[];
    setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}

const FrameLayerPanel: React.FC<FrameLayerPanelProps> = ({ layers, setLayers }) => {
    const toggleVisibility = (id: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
    };

    const toggleLock = (id: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, isLocked: !l.isLocked } : l));
    };

    return (
        <div className="w-48 md:w-64 flex-shrink-0 border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0a0e] flex flex-col">
            {/* Header spacing to align with tracks top */}
            <div className="h-8 border-b border-slate-200 dark:border-white/5" />

            {/* Layers */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2">
                {layers.map(layer => (
                    <div key={layer.id} className="h-16 flex items-center justify-between px-3 border-b border-slate-200/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                        <span className="text-xs font-semibold text-slate-700 dark:text-white/80 truncate w-24 md:w-32">{layer.name}</span>
                        <div className="flex items-center space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => toggleLock(layer.id)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded">
                                {layer.isLocked ? <Lock size={12} className="text-red-400" /> : <Unlock size={12} className="text-slate-400" />}
                            </button>
                            <button onClick={() => toggleVisibility(layer.id)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded">
                                {!layer.isVisible ? <EyeOff size={14} className="text-slate-500" /> : <Eye size={14} className="text-slate-700 dark:text-white" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FrameLayerPanel;
