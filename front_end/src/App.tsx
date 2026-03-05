import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Minus, 
  Maximize, 
  Download, 
  RotateCcw, 
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Frame {
  id: string;
  url: string;
  isKeyframe: boolean;
}

type AIStatus = 'Idle' | 'Processing' | 'Completed';

function App() {
  // State
  const [keyframe1, setKeyframe1] = useState<string | null>(null);
  const [keyframe2, setKeyframe2] = useState<string | null>(null);
  const [interpolationScale, setInterpolationScale] = useState(2);
  const [frameDensity, setFrameDensity] = useState(5);
  const [motionSmoothness, setMotionSmoothness] = useState(50);
  const [aiMotionRefinement, setAiMotionRefinement] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const [aiStatus, setAiStatus] = useState<AIStatus>('Idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [zoom, setZoom] = useState(100);

  // Refs
  const playbackRef = useRef<number | null>(null);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setter(url);
    }
  };

  const handleReset = () => {
    setKeyframe1(null);
    setKeyframe2(null);
    setFrames([]);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
    setAiStatus('Idle');
  };

  const generateFrames = async () => {
    if (!keyframe1 || !keyframe2) return;

    setIsGenerating(true);
    setAiStatus('Processing');
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const count = interpolationScale * frameDensity;
    const generated: Frame[] = Array.from({ length: count }, (_, i) => ({
      id: `ai-${i}`,
      url: `https://via.placeholder.com/800x450/1a1c23/5271ff?text=AI+Frame+${i + 1}`,
      isKeyframe: false
    }));

    const allFrames: Frame[] = [
      { id: 'kf1', url: keyframe1, isKeyframe: true },
      ...generated,
      { id: 'kf2', url: keyframe2, isKeyframe: true }
    ];

    setFrames(allFrames);
    setCurrentFrameIndex(0);
    setIsGenerating(false);
    setAiStatus('Completed');
  };

  // Playback Control
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      const interval = 1000 / (12 * playbackSpeed); // Base 12fps
      playbackRef.current = window.setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, interval);
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [isPlaying, frames.length, playbackSpeed]);

  // Neural Network Loading Animation Component
  const NeuralLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse">
          <circle cx="20" cy="50" r="4" fill="#8c52ff" />
          <circle cx="50" cy="20" r="4" fill="#8c52ff" />
          <circle cx="50" cy="80" r="4" fill="#8c52ff" />
          <circle cx="80" cy="50" r="4" fill="#8c52ff" />
          <circle cx="50" cy="50" r="6" fill="#5271ff" className="animate-ping" />
          
          <line x1="20" y1="50" x2="50" y2="20" stroke="#8c52ff" strokeWidth="1" opacity="0.5" />
          <line x1="20" y1="50" x2="50" y2="80" stroke="#8c52ff" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="20" x2="80" y2="50" stroke="#8c52ff" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="80" x2="80" y2="50" stroke="#8c52ff" strokeWidth="1" opacity="0.5" />
          <line x1="20" y1="50" x2="50" y2="50" stroke="#5271ff" strokeWidth="2" />
          <line x1="80" y1="50" x2="50" y2="50" stroke="#5271ff" strokeWidth="2" />
          <line x1="50" y1="20" x2="50" y2="50" stroke="#5271ff" strokeWidth="2" />
          <line x1="50" y1="80" x2="50" y2="50" stroke="#5271ff" strokeWidth="2" />
        </svg>
      </div>
      <p className="text-neon-purple font-bold text-lg animate-pulse">AI Generating Intermediate Frames...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-near-black text-white font-sans overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-slate-gray/50 backdrop-blur-md z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-purple-blue rounded-lg flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">2D Animation Studio</span>
        </div>

        <div className="flex items-center space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Upload size={18} />
            <span>Import Frames</span>
          </button>
          <button onClick={handleReset} className="btn-secondary flex items-center space-x-2">
            <RotateCcw size={18} />
            <span>Reset Project</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Download size={18} />
            <span>Export Video</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 flex flex-col border-r border-white/5 bg-slate-gray/30 backdrop-blur-sm overflow-y-auto p-4 space-y-6">
          {/* Keyframe Uploads */}
          <div className="space-y-4">
            <div 
              className={`upload-card ${keyframe1 ? 'border-neon-purple/50' : ''}`}
              onClick={() => fileInput1Ref.current?.click()}
            >
              <input type="file" ref={fileInput1Ref} hidden onChange={(e) => handleFileUpload(e, setKeyframe1)} />
              {keyframe1 ? (
                <div className="relative group">
                  <img src={keyframe1} className="w-full h-32 object-cover rounded-lg" alt="Start Keyframe" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <span className="text-sm font-medium">Replace Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-medium text-white/70">Upload Keyframe 1 (Start)</span>
                  <span className="text-xs text-white/40">Drag & drop image here</span>
                </div>
              )}
            </div>

            <div 
              className={`upload-card ${keyframe2 ? 'border-neon-blue/50' : ''}`}
              onClick={() => fileInput2Ref.current?.click()}
            >
              <input type="file" ref={fileInput2Ref} hidden onChange={(e) => handleFileUpload(e, setKeyframe2)} />
              {keyframe2 ? (
                <div className="relative group">
                  <img src={keyframe2} className="w-full h-32 object-cover rounded-lg" alt="End Keyframe" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <span className="text-sm font-medium">Replace Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <div className="w-10 h-10 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-medium text-white/70">Upload Keyframe 2 (End)</span>
                  <span className="text-xs text-white/40">Drag & drop image here</span>
                </div>
              )}
            </div>
          </div>

          {/* Interpolation Settings */}
          <div className="glass-panel-dark">
            <button 
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Settings size={18} className="text-white/60" />
                <span className="font-semibold text-sm">Interpolation Settings</span>
              </div>
              {isSettingsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {isSettingsExpanded && (
              <div className="p-4 space-y-5 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Interpolation Scale</label>
                  <select 
                    value={interpolationScale}
                    onChange={(e) => setInterpolationScale(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-purple transition-colors"
                  >
                    <option value={2}>2x Scale</option>
                    <option value={4}>4x Scale</option>
                    <option value={8}>8x Scale</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Frame Density</label>
                    <span className="text-xs font-mono">{frameDensity}</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={frameDensity}
                    onChange={(e) => setFrameDensity(Number(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Motion Smoothness</label>
                    <span className="text-xs font-mono">{motionSmoothness}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={motionSmoothness}
                    onChange={(e) => setMotionSmoothness(Number(e.target.value))}
                    className="w-full accent-neon-blue"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="aiRefine"
                    checked={aiMotionRefinement}
                    onChange={(e) => setAiMotionRefinement(e.target.checked)}
                    className="w-4 h-4 accent-neon-purple rounded border-white/10"
                  />
                  <label htmlFor="aiRefine" className="text-sm text-white/70 select-none cursor-pointer">Enable AI Motion Refinement</label>
                </div>
              </div>
            )}
          </div>

          {/* AI Status & Generate Button */}
          <div className="mt-auto pt-6 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-white/40 uppercase">AI Model Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  aiStatus === 'Processing' ? 'bg-yellow-400 animate-pulse' : 
                  aiStatus === 'Completed' ? 'bg-green-500' : 'bg-white/20'
                }`} />
                <span className={`text-xs font-medium ${
                  aiStatus === 'Processing' ? 'text-yellow-400' : 
                  aiStatus === 'Completed' ? 'text-green-500' : 'text-white/40'
                }`}>{aiStatus}</span>
              </div>
            </div>

            <button 
              onClick={generateFrames}
              disabled={isGenerating || !keyframe1 || !keyframe2}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                isGenerating || !keyframe1 || !keyframe2
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-gradient-purple-blue hover:shadow-neon-purple active:scale-95'
              }`}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Cpu size={20} />}
              <span>{isGenerating ? 'Processing AI...' : 'Generate Intermediate Frames'}</span>
            </button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col relative bg-[#0a0a0e] canvas-grid">
          {/* Canvas Controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 glass-panel p-1.5 z-10">
            <button onClick={() => setZoom(Math.max(10, zoom - 10))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Minus size={18} /></button>
            <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(500, zoom + 10))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={18} /></button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button onClick={() => setZoom(100)} className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2">
              <Maximize size={16} />
              <span className="text-xs font-medium">Fit</span>
            </button>
          </div>

          <div className="absolute top-4 right-6 flex flex-col items-end space-y-1 z-10">
             <div className="glass-panel px-3 py-1.5 flex items-center space-x-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Frame</span>
                <span className="text-lg font-mono font-bold text-neon-purple">
                  {String(currentFrameIndex).padStart(3, '0')}
                </span>
             </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex-1 flex items-center justify-center p-12 overflow-hidden">
            <div 
              className="relative shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {isGenerating && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                  <NeuralLoader />
                </div>
              )}

              {frames.length > 0 ? (
                <img 
                  src={frames[currentFrameIndex].url} 
                  className="max-w-full max-h-[70vh] rounded-lg shadow-2xl border border-white/10"
                  alt={`Frame ${currentFrameIndex}`}
                />
              ) : (
                <div className="w-[800px] h-[450px] bg-slate-gray/20 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-white/40 font-medium">Upload keyframes to begin interpolation</p>
                    <p className="text-white/20 text-sm">Professional AI-assisted 2D Motion Synthesis</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="h-56 bg-slate-gray/50 border-t border-white/5 backdrop-blur-xl flex flex-col">
            {/* Timeline Controls */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 flex items-center justify-center bg-white text-near-black rounded-full hover:scale-105 transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                  <button 
                    onClick={() => setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                <div className="flex items-center bg-black/30 rounded-lg p-1">
                  {[0.25, 0.5, 1, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        playbackSpeed === speed ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-neon-purple shadow-[0_0_8px_rgba(140,82,255,0.6)]" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-tighter">Keyframes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-neon-blue shadow-[0_0_8px_rgba(82,113,255,0.6)]" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-tighter">AI Generated</span>
                </div>
              </div>
            </div>

            {/* Scrollable Track */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4 flex items-center space-x-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {frames.length > 0 ? (
                frames.map((frame, idx) => (
                  <div 
                    key={frame.id}
                    onClick={() => setCurrentFrameIndex(idx)}
                    className={`relative flex-shrink-0 w-32 h-20 rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
                      currentFrameIndex === idx 
                      ? 'border-white scale-105 z-10' 
                      : frame.isKeyframe 
                        ? 'border-neon-purple/40 opacity-70 hover:opacity-100 hover:border-neon-purple'
                        : 'border-neon-blue/40 opacity-50 hover:opacity-100 hover:border-neon-blue'
                    }`}
                  >
                    <img src={frame.url} className="w-full h-full object-cover" alt={`T-${idx}`} />
                    <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      frame.isKeyframe ? 'bg-neon-purple text-white' : 'bg-neon-blue text-white'
                    }`}>
                      {frame.isKeyframe ? 'Key' : `F${idx}`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                  <span className="text-white/10 font-mono text-sm">TIMELINE EMPTY</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
