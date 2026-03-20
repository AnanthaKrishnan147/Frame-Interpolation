import { useState, useEffect } from 'react';
import { Cpu, RotateCcw, Menu, X, Columns, Play, Pause, SkipBack, SkipForward, Minus, Plus, Maximize, Loader2, Moon, Sun, Repeat } from 'lucide-react';
import type { Frame, AIStatus, Marker, Layer, SelectionRange } from './types';
import UploadPanel from './components/UploadPanel';
import InterpolationSettings from './components/InterpolationSettings';
import ExportControls from './components/ExportControls';
import FramePlayer from './components/FramePlayer';
import TimelineEditor from './components/TimelineEditor/TimelineEditor';
import TimelineZoomControls from './components/TimelineEditor/TimelineZoomControls';
import GeneratedFramesPreview from './components/GeneratedFramesPreview';

function App() {
  // State
  const [keyframe1, setKeyframe1] = useState<string | null>(null);
  const [keyframe1Name, setKeyframe1Name] = useState<string | null>(null);
  const [keyframe2, setKeyframe2] = useState<string | null>(null);
  const [keyframe2Name, setKeyframe2Name] = useState<string | null>(null);
  const [targetFps, setTargetFps] = useState(24);
  const [motionSmoothness, setMotionSmoothness] = useState(50);
  const [aiMotionRefinement, setAiMotionRefinement] = useState(true);
  const [aiStatus, setAiStatus] = useState<AIStatus>('Idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showComparison, setShowComparison] = useState(false);
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);

  // Advanced Timeline State
  const [timelineZoom, setTimelineZoom] = useState(100);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'l1', name: 'Original Keyframes', isVisible: true, isLocked: false, type: 'keyframes' },
    { id: 'l2', name: 'AI Generated', isVisible: true, isLocked: false, type: 'generated' },
    { id: 'l3', name: 'Preview', isVisible: true, isLocked: false, type: 'preview' }
  ]);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });

  // Mobile Support
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentFrameIndex(prev => Math.min(frames.length > 0 ? frames.length - 1 : 0, prev + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentFrameIndex(prev => Math.max(0, prev - 1));
          break;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Zoom timeline
        setTimelineZoom(prev => {
          const newZoom = prev - e.deltaY * 0.1;
          return Math.max(50, Math.min(500, newZoom));
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [frames.length]);

  const handleReset = () => {
    setKeyframe1(null);
    setKeyframe1Name(null);
    setKeyframe2(null);
    setKeyframe2Name(null);
    setFrames([]);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
    setAiStatus('Idle');
    setShowComparison(false);
    setOnionSkinEnabled(false);
  };

  const generateFrames = async () => {
    if (!keyframe1 || !keyframe2) return;

    setIsGenerating(true);
    setAiStatus('Processing');
    setIsSidebarOpen(false); // Close sidebar on mobile when generating

    try {
      // Get Blobs from the object URLs
      const blob1 = await fetch(keyframe1).then(r => r.blob());
      const blob2 = await fetch(keyframe2).then(r => r.blob());

      const formData = new FormData();
      formData.append("frameA", blob1, keyframe1Name || "frameA.png");
      formData.append("frameB", blob2, keyframe2Name || "frameB.png");
      formData.append("targetFps", targetFps.toString());

      const response = await fetch("http://localhost:5000/interpolate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to generate intermediate frames.");
      }

      // Read response as ArrayBuffer (zip file)
      const arrayBuffer = await response.arrayBuffer();

      // Load JSZip dynamically to avoid breaking initial imports
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);

      const generated: Frame[] = [];
      let i = 1;

      // Sort files alphabetically to ensure correct order
      const files = Object.keys(zip.files).sort();

      for (const filename of files) {
        if (!filename.endsWith('/')) { // Only process files, not directories
          const fileData = await zip.files[filename].async("blob");
          const generatedUrl = URL.createObjectURL(fileData);
          generated.push({
            id: `ai-${i++}`,
            url: generatedUrl,
            isKeyframe: false
          });
        }
      }

      const allFrames: Frame[] = [
        { id: 'kf1', url: keyframe1, isKeyframe: true },
        ...generated,
        { id: 'kf2', url: keyframe2, isKeyframe: true }
      ];

      setFrames(allFrames);
      setCurrentFrameIndex(0);
      setAiStatus('Completed');
    } catch (error) {
      console.error(error);
      setAiStatus('Idle');
      alert("Error generating frames. Ensure backend server is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div
        className="flex flex-col h-screen bg-slate-50 dark:bg-[#0a0a0e] text-slate-900 dark:text-white font-sans overflow-hidden selection:bg-neon-purple/30 transition-colors duration-300"
      >
        {/* Top Toolbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-xl z-30 sticky top-0 shadow-sm dark:shadow-lg transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="w-10 h-10 bg-gradient-purple-blue rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(140,82,255,0.4)]">
              <Cpu size={22} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:block bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-white/70 bg-clip-text text-transparent">2D Animation Studio</span>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 md:px-4 md:py-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-lg flex items-center space-x-2 transition-colors border border-transparent dark:hover:border-white/10 text-slate-700 dark:text-white"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="hidden md:inline font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button onClick={handleReset} className="p-2 md:px-4 md:py-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-lg flex items-center space-x-2 transition-colors border border-transparent dark:hover:border-white/10 text-slate-700 dark:text-white">
              <RotateCcw size={18} />
              <span className="hidden md:inline font-medium text-sm">Reset</span>
            </button>

            <ExportControls frames={frames} isGenerating={isGenerating} selectionRange={selectionRange} />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar Overlay for Mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Left Sidebar */}
          <aside className={`
          absolute md:relative w-80 h-full max-w-[85vw] flex flex-col border-r border-slate-200 dark:border-white/10 
          bg-white/95 dark:bg-[#13141a]/95 backdrop-blur-xl overflow-y-auto p-5 space-y-6 z-30 
          transition-transform duration-300 ease-in-out block shadow-2xl md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            {/* Keyframe Uploads */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-widest pl-1">Keyframes</h3>
              <UploadPanel
                label="Keyframe 1 (Start)"
                image={keyframe1}
                fileName={keyframe1Name}
                onUpload={(url, file) => {
                  setKeyframe1(url);
                  setKeyframe1Name(file.name);
                }}
                colorTheme="purple"
              />
              <UploadPanel
                label="Keyframe 2 (End)"
                image={keyframe2}
                fileName={keyframe2Name}
                onUpload={(url, file) => {
                  setKeyframe2(url);
                  setKeyframe2Name(file.name);
                }}
                colorTheme="blue"
              />
            </div>

            <div className="border-t border-slate-200 dark:border-white/5 pt-6">
              <InterpolationSettings
                targetFps={targetFps}
                setTargetFps={setTargetFps}
                motionSmoothness={motionSmoothness}
                setMotionSmoothness={setMotionSmoothness}
                aiMotionRefinement={aiMotionRefinement}
                setAiMotionRefinement={setAiMotionRefinement}
              />
            </div>

            {/* AI Status & Generate Button bg-gradient-purple-blue */}
            <div className="mt-auto pt-8 pb-4 space-y-4">
              <div className="flex items-center justify-between px-2 bg-slate-100 dark:bg-black/30 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">AI Status</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${aiStatus === 'Processing' ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.6)]' :
                    aiStatus === 'Completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300 dark:bg-white/20'
                    }`} />
                  <span className={`text-xs font-bold ${aiStatus === 'Processing' ? 'text-yellow-500 dark:text-yellow-400' :
                    aiStatus === 'Completed' ? 'text-green-600 dark:text-green-500' : 'text-slate-500 dark:text-white/40'
                    }`}>{aiStatus}</span>
                </div>
              </div>

              <button
                onClick={generateFrames}
                disabled={isGenerating || !keyframe1 || !keyframe2}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center space-x-2 transition-all ${isGenerating || !keyframe1 || !keyframe2
                  ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/20 cursor-not-allowed border border-slate-200 dark:border-white/5'
                  : 'btn-primary'
                  }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Cpu size={20} />}
                <span>{isGenerating ? 'Processing...' : 'Generate Frames'}</span>
              </button>
            </div>
          </aside>

          {/* Main Workspace Area (Canvas + Timeline + Frame Preview) */}
          <main className="flex-1 flex flex-col relative canvas-grid min-w-0 overflow-y-auto">

            {/* Canvas Toolbar Overlays */}
            {frames.length > 0 && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">

                {/* Zoom Controls */}
                <div className="glass-panel p-1.5 flex items-center space-x-1 border border-slate-200 dark:border-white/10 shadow-lg pointer-events-auto rounded-lg bg-white/80 dark:bg-black/60 backdrop-blur-md">
                  <button onClick={() => setZoom(Math.max(10, zoom - 10))} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors text-slate-700 dark:text-white"><Minus size={16} /></button>
                  <span className="text-xs font-mono w-12 text-center text-slate-800 dark:text-white/90">{zoom}%</span>
                  <button onClick={() => setZoom(Math.min(500, zoom + 10))} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors text-slate-700 dark:text-white"><Plus size={16} /></button>
                  <div className="w-px h-5 bg-slate-300 dark:bg-white/10 mx-1" />
                  <button onClick={() => setZoom(100)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors flex items-center text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white">
                    <Maximize size={14} />
                  </button>
                </div>

                <div className="flex flex-col items-end space-y-2 group pointer-events-auto">
                  {/* Frame Counter */}
                  <div className="glass-panel px-4 py-2 flex items-center space-x-3 border border-slate-200 dark:border-white/10 shadow-lg rounded-lg bg-white/80 dark:bg-black/60 backdrop-blur-md">
                    <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Frame</span>
                    <span className="text-xl font-mono font-bold bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                      {String(currentFrameIndex).padStart(3, '0')}
                    </span>
                  </div>

                  {/* Comparison Toggle */}
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-lg flex items-center space-x-2 ${showComparison
                      ? 'bg-neon-purple/10 dark:bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_15px_rgba(140,82,255,0.2)]'
                      : 'bg-white/80 dark:bg-black/60 backdrop-blur-md border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <Columns size={14} />
                    <span>Compare Mode</span>
                  </button>

                  {/* Onion Skin Toggle */}
                  <button
                    onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
                    className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all shadow-lg flex items-center space-x-2 ${onionSkinEnabled
                      ? 'bg-neon-blue/10 dark:bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(82,113,255,0.2)]'
                      : 'bg-white/80 dark:bg-black/60 backdrop-blur-md border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <div className="w-3 h-3 rounded-full border-2 border-current opacity-70" />
                    <span>Onion Skin</span>
                  </button>
                </div>
              </div>
            )}

            {/* Canvas Preview Area */}
            <div className="flex-1 min-h-[50vh] flex flex-col relative">
              <FramePlayer
                frames={frames}
                currentFrameIndex={currentFrameIndex}
                setCurrentFrameIndex={setCurrentFrameIndex}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                zoom={zoom}
                isGenerating={isGenerating}
                showComparison={showComparison}
                onionSkinEnabled={onionSkinEnabled}
              />
            </div>

            {/* Timeline Panel */}
            <div className="h-48 md:h-56 bg-white/90 dark:bg-[#13141a]/90 border-t border-slate-200 dark:border-white/10 backdrop-blur-xl flex flex-col z-10 shrink-0">
              {/* Timeline Controls Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-white/5 gap-3">
                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start space-x-4 md:space-x-8">
                  {/* Playback Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                      title="Previous Frame"
                    >
                      <SkipBack size={18} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-xl dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                      onClick={() => setCurrentFrameIndex(Math.min(frames.length > 0 ? frames.length - 1 : 0, currentFrameIndex + 1))}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                      title="Next Frame"
                    >
                      <SkipForward size={18} />
                    </button>
                    <button
                      onClick={() => setIsLooping(!isLooping)}
                      className={`p-2 rounded-full transition-colors ml-2 ${isLooping ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40' : 'hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'}`}
                      title="Toggle Loop"
                    >
                      <Repeat size={16} />
                    </button>
                  </div>

                  {/* Speed Controls */}
                  <div className="flex items-center bg-slate-200 dark:bg-black/40 rounded-lg p-1 border border-slate-300 dark:border-white/5">
                    {[0.25, 0.5, 1, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${playbackSpeed === speed
                          ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/80 hover:bg-white/50 dark:hover:bg-white/5'
                          }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Controls (Zoom & Ext) */}
                <div className="flex items-center space-x-4">
                  <TimelineZoomControls timelineZoom={timelineZoom} setTimelineZoom={setTimelineZoom} />

                  <div className="hidden sm:flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_8px_rgba(140,82,255,0.6)]" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Key</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(82,113,255,0.6)]" />
                      <span className="text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Gen</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Timeline Component */}
              <div className="flex-1 flex min-h-0 bg-slate-100 dark:bg-black/20">
                <TimelineEditor
                  frames={frames}
                  currentFrameIndex={currentFrameIndex}
                  setCurrentFrameIndex={setCurrentFrameIndex}
                  markers={markers}
                  setMarkers={setMarkers}
                  layers={layers}
                  setLayers={setLayers}
                  timelineZoom={timelineZoom}
                  selectionRange={selectionRange}
                  setSelectionRange={setSelectionRange}
                />
              </div>
            </div>

            {/* Generated Frames Preview Section */}
            <GeneratedFramesPreview frames={frames} />
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
