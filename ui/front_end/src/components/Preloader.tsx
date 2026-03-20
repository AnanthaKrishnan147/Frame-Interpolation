import { useState, useEffect } from 'react';
import logoImage from '../assets/image.png';

interface PreloaderProps {
    onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate loading progress
        const duration = 2500; // 2.5 seconds total loading time
        const intervalTime = 50; // Update every 50ms
        const steps = duration / intervalTime;
        let currentStep = 0;

        const progressInterval = setInterval(() => {
            currentStep++;
            const newProgress = Math.min((currentStep / steps) * 100, 100);

            // Add a slight ease-out effect to the progress
            const easedProgress = newProgress + (100 - newProgress) * 0.05 * (currentStep / steps);

            setProgress(Math.min(easedProgress, 100));

            if (currentStep >= steps) {
                clearInterval(progressInterval);
                setIsFadingOut(true);

                // Wait for fade out animation to complete
                setTimeout(() => {
                    onComplete();
                }, 1000); // 1 second fade out duration
            }
        }, intervalTime);

        return () => clearInterval(progressInterval);
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000 ease-in-out font-mono ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            {/* Logo Container with Scanning Line */}
            <div className="relative mb-8 overflow-hidden rounded-xl">
                <img
                    src={logoImage}
                    alt="AniFrame Logo"
                    className="w-48 md:w-64 lg:w-80 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                />

                {/* Animated Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-neon-purple/80 shadow-[0_0_8px_rgba(140,82,255,0.8)] animate-[scan_2s_ease-in-out_infinite]" />

                {/* Subtle grid overlay for AI feel */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none mix-blend-overlay" />
            </div>

            {/* Loading Text */}
            <div className="text-white/80 text-sm md:text-base font-medium tracking-widest uppercase mb-6 flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                <span>Initializing AniFrame AI...</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-64 md:w-80 h-1.5 bg-white/10 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                {/* Animated gradients for progress fill */}
                <div
                    className="h-full bg-gradient-to-r from-neon-purple via-neon-blue to-neon-purple rounded-full relative transition-all duration-75 ease-out"
                    style={{
                        width: `${progress}%`,
                        backgroundSize: '200% 100%',
                        animation: 'gradientMove 2s linear infinite'
                    }}
                >
                    {/* Subtle glow effect on the progress bar */}
                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/50 blur-[2px] rounded-full" />
                </div>
            </div>

            {/* Percentage Text */}
            <div className="mt-3 text-[10px] text-white/40 font-bold tracking-widest">
                {Math.round(progress)}%
            </div>
        </div>
    );
}
