import React, { useRef, useState, type DragEvent } from 'react';
import { Plus } from 'lucide-react';

interface UploadPanelProps {
    label: string;
    image: string | null;
    fileName?: string | null;
    onUpload: (url: string, file: File) => void;
    colorTheme: 'purple' | 'blue';
}

const UploadPanel: React.FC<UploadPanelProps> = ({ label, image, fileName, onUpload, colorTheme }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const themeClass = colorTheme === 'purple' ? 'border-neon-purple text-neon-purple bg-neon-purple' : 'border-neon-blue text-neon-blue bg-neon-blue';

    const handleFile = (file?: File) => {
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            const url = URL.createObjectURL(file);
            onUpload(url, file);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files?.[0]);
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
    };

    return (
        <div
            className={`upload-card border-2 transition-all cursor-pointer ${image ? `border-${colorTheme === 'purple' ? 'neon-purple' : 'neon-blue'}/50` : 'border-dashed border-slate-300 dark:border-white/20'} ${isDragging ? `border-${colorTheme === 'purple' ? 'neon-purple' : 'neon-blue'}` : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} hidden onChange={onChange} />
            {image ? (
                <div className="relative group overflow-hidden rounded-lg">
                    <img src={image} className="w-full h-32 object-cover" alt={label} />
                    {fileName && (
                        <div className="absolute top-2 left-2 right-2 bg-white/80 dark:bg-black/60 backdrop-blur-md rounded px-2 py-1 flex items-center shadow-lg border border-slate-200 dark:border-white/10">
                            <span className="text-[10px] font-mono text-slate-700 dark:text-white/80 truncate">{fileName}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Replace Image</span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeClass.replace('border-', '').replace('text-', '').replace('bg-', 'bg-')}/20 ${themeClass.replace('border-', '').replace('bg-', '')}`}>
                        <Plus size={24} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-white/70">{label}</span>
                    <span className="text-xs text-slate-500 dark:text-white/40 text-center px-4">Drop keyframes here or click to upload<br />(PNG, JPG)</span>
                </div>
            )}
        </div>
    );
};

export default UploadPanel;
