import React, { useState } from 'react';
import { useEngineStore, ENGINES, type AnimationSpeed } from '@/store/engineStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  Cpu, 
  Palette,
  Sparkles,
  BarChart3,
  Play,
  Square,
  Cloud,
  Monitor
} from 'lucide-react';

interface SystemCockpitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ANIMATION_SPEEDS: { value: AnimationSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'default', label: 'Default' },
  { value: 'fast', label: 'Fast' },
];

export const SystemCockpit: React.FC<SystemCockpitProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState('engine');
  const engineStore = useEngineStore();
  
  const {
    status,
    statusMessage,
    selectedEngine,
    threads,
    hashSize,
    energySavingMode,
    setEngineSettings,
    setEnergySavingMode,
    analysisMode,
    maxDepth,
    maxTimePerMove,
    setAnalysisMode,
    setMaxDepth,
    setMaxTimePerMove,
    enlargePieceOnDrag,
    animationSpeed,
    drawArrows,
    setEnlargePieceOnDrag,
    setAnimationSpeed,
    setDrawArrows,
    figurineNotation,
    soundEnabled,
    setFigurineNotation,
    setSoundEnabled,
    showPinnedPieces,
    showKingInCheck,
    showUndefendedPieces,
    showPieceMobility,
    showIsolatedPawns,
    showPassedPawns,
    setShowPinnedPieces,
    setShowKingInCheck,
    setShowUndefendedPieces,
    setShowPieceMobility,
    setShowIsolatedPawns,
    setShowPassedPawns,
  } = engineStore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 rounded-[2rem] border-2 border-zinc-800 bg-zinc-900 shadow-[0_12px_0_0_#09090b] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 border-b-2 border-zinc-800 shrink-0 bg-zinc-950">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-[0_4px_0_0_#4a6728]">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">System Cockpit</DialogTitle>
              <DialogDescription className="text-zinc-500 font-bold text-xs uppercase tracking-wider">
                Deep configuration for the Stockfish engine and UI
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-1 overflow-hidden bg-zinc-900"
        >
          {/* Sidebar Navigation */}
          <div className="w-72 border-r-2 border-zinc-800 bg-zinc-950 p-4 shrink-0 overflow-y-auto">
            <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full border-0 shadow-none p-0">
              {[
                { value: 'engine', icon: Cpu, label: 'Engine' },
                { value: 'visuals', icon: Palette, label: 'Visuals' },
                { value: 'key-elements', icon: Sparkles, label: 'Pro Features', badge: 'PRO' },
                { value: 'analysis', icon: BarChart3, label: 'Analysis' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="w-full justify-start gap-4 px-5 py-4 h-auto data-[state=active]:bg-primary rounded-xl text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_0_0_#4a6728] text-sm font-black transition-all active:translate-y-[2px] active:shadow-none text-left uppercase tracking-wider border-2 border-transparent data-[state=active]:border-primary"
                >
                  <tab.icon size={20} className="shrink-0" />
                  <span className="flex-1 truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600 text-white font-black shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-zinc-900">
            
            {/* Engine Tab */}
            <TabsContent value="engine" className="m-0 space-y-8">
              <div className={cn(
                "p-6 rounded-2xl border-2 flex items-center justify-between relative overflow-hidden",
                status === 'ready' ? 'bg-green-500/10 border-green-500/50' :
                status === 'booting' ? 'bg-amber-500/10 border-amber-500/50' :
                status === 'error' ? 'bg-red-500/10 border-red-500/50' : 'bg-zinc-800 border-zinc-700'
              )}>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    status === 'ready' ? 'bg-green-500' : status === 'booting' ? 'bg-amber-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'
                  )} />
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-tight">
                      {status === 'ready' ? 'Engine Active' : status === 'booting' ? 'Booting...' : status === 'error' ? 'Fault' : 'Offline'}
                    </div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{statusMessage}</div>
                  </div>
                </div>
                
                {status === 'offline' || status === 'error' ? (
                  <Button onClick={() => engineStore.bootEngine()} size="sm" className="bg-green-600 hover:bg-green-500 text-white font-black px-6 rounded-xl border-green-700 shadow-[0_4px_0_0_#14532d]">
                    <Play className="w-4 h-4 mr-2" /> BOOT
                  </Button>
                ) : (
                  <Button onClick={() => engineStore.shutdownEngine()} size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10 font-black px-6 rounded-xl shadow-[0_4px_0_0_#450a0a]">
                    <Square className="w-4 h-4 mr-2" /> STOP
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Runtime Selection</Label>
                <div className="grid grid-cols-1 gap-3">
                  {ENGINES.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => engineStore.selectEngine(engine.id)}
                      disabled={status === 'ready' || status === 'booting'}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
                        selectedEngine === engine.id
                          ? 'bg-zinc-800 border-primary shadow-[0_4px_0_0_#4a6728] translate-y-[-2px]'
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600 shadow-[0_4px_0_0_#09090b]'
                      )}
                    >
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center border-2 shrink-0",
                        selectedEngine === engine.id
                          ? (engine.isCloud ? 'bg-blue-500 text-white border-blue-600' : 'bg-purple-500 text-white border-purple-600')
                          : (engine.isCloud ? 'bg-zinc-900 text-blue-400 border-zinc-700' : 'bg-zinc-900 text-purple-400 border-zinc-700')
                      )}>
                        {engine.isCloud ? <Cloud size={28} /> : <Monitor size={28} />}
                      </div>
                      <div className="flex-1 text-left truncate">
                        <div className="font-black text-white text-base uppercase tracking-tight truncate">{engine.name}</div>
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest truncate">{engine.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Threads</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{threads}</span>
                  </div>
                  <Slider value={[threads]} onValueChange={(v) => setEngineSettings({ threads: v[0] })} min={1} max={8} step={1} />
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hash Memory</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{hashSize}MB</span>
                  </div>
                  <Slider value={[hashSize]} onValueChange={(v) => setEngineSettings({ hashSize: v[0] })} min={16} max={1024} step={16} />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-between shadow-[0_4px_0_0_#09090b]">
                <div>
                  <div className="text-sm font-black text-white uppercase tracking-tight">Energy Saving Mode</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Reduce CPU usage when idle</div>
                </div>
                <Switch checked={energySavingMode} onCheckedChange={setEnergySavingMode} />
              </div>
            </TabsContent>

            {/* Visuals Tab */}
            <TabsContent value="visuals" className="m-0 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Enlarge on Drag', value: enlargePieceOnDrag, setter: setEnlargePieceOnDrag, desc: 'Scale pieces while moving' },
                  { label: 'Draw Arrows', value: drawArrows, setter: setDrawArrows, desc: 'Show suggested moves' },
                  { label: 'Notation', value: figurineNotation, setter: setFigurineNotation, desc: 'Use figurine icons' },
                  { label: 'Sound', value: soundEnabled, setter: setSoundEnabled, desc: 'Play match audio' },
                ].map((item) => (
                  <div key={item.label} className="p-6 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-between group hover:border-zinc-600 transition-colors shadow-[0_4px_0_0_#09090b]">
                    <div>
                      <div className="text-sm font-black text-white uppercase tracking-tight">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.desc}</div>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.setter} />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Animation Speed</Label>
                <div className="grid grid-cols-3 gap-3">
                  {ANIMATION_SPEEDS.map((speed) => (
                    <button
                      key={speed.value}
                      onClick={() => setAnimationSpeed(speed.value)}
                      className={cn(
                        "py-3 rounded-xl border-2 font-black uppercase text-xs transition-all",
                        animationSpeed === speed.value
                          ? "bg-primary border-primary text-white shadow-[0_4px_0_0_#4a6728] translate-y-[-2px]"
                          : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                      )}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Pro Features Tab */}
            <TabsContent value="key-elements" className="m-0 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'showPinnedPieces', label: 'Pinned Pieces', value: showPinnedPieces, setter: setShowPinnedPieces },
                  { key: 'showKingInCheck', label: 'Check Indicator', value: showKingInCheck, setter: setShowKingInCheck },
                  { key: 'showUndefendedPieces', label: 'Undefended Pieces', value: showUndefendedPieces, setter: setShowUndefendedPieces },
                  { key: 'showPieceMobility', label: 'Piece Mobility', value: showPieceMobility, setter: setShowPieceMobility },
                  { key: 'showIsolatedPawns', label: 'Isolated Pawns', value: showIsolatedPawns, setter: setShowIsolatedPawns },
                  { key: 'showPassedPawns', label: 'Passed Pawns', value: showPassedPawns, setter: setShowPassedPawns },
                ].map((item) => (
                  <div key={item.key} className="p-5 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-between hover:bg-zinc-700 transition-all group shadow-[0_4px_0_0_#09090b]">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Sparkles size={20} className="text-purple-400" />
                      </div>
                      <span className="text-sm font-black text-white uppercase tracking-tight">{item.label}</span>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.setter} />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="m-0 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setAnalysisMode('depth')} className={cn("p-6 rounded-2xl border-2 transition-all text-left shadow-[0_4px_0_0_#09090b]", analysisMode === 'depth' ? 'border-primary bg-primary/10 translate-y-[-2px]' : 'border-zinc-700 bg-zinc-800')}>
                  <div className="text-lg font-black text-white uppercase tracking-tight">Depth</div>
                  <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Fixed search depth</div>
                </button>
                <button onClick={() => setAnalysisMode('time')} className={cn("p-6 rounded-2xl border-2 transition-all text-left shadow-[0_4px_0_0_#09090b]", analysisMode === 'time' ? 'border-primary bg-primary/10 translate-y-[-2px]' : 'border-zinc-700 bg-zinc-800')}>
                  <div className="text-lg font-black text-white uppercase tracking-tight">Time</div>
                  <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Fixed time limit</div>
                </button>
              </div>

              {analysisMode === 'depth' ? (
                <div className="space-y-5 p-8 rounded-2xl bg-zinc-800 border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b]">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max Search Depth</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{maxDepth}</span>
                  </div>
                  <Slider value={[maxDepth]} onValueChange={(v) => setMaxDepth(v[0])} min={10} max={30} step={1} />
                </div>
              ) : (
                <div className="space-y-5 p-8 rounded-2xl bg-zinc-800 border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b]">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max Time per Move (s)</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{maxTimePerMove}s</span>
                  </div>
                  <Slider value={[maxTimePerMove]} onValueChange={(v) => setMaxTimePerMove(v[0])} min={1} max={30} step={1} />
                </div>
              )}
              
              <div className="space-y-5 p-8 rounded-2xl bg-zinc-800 border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b]">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Multi-PV Lines</Label>
                  <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{engineStore.multiPv}</span>
                </div>
                <Slider value={[engineStore.multiPv]} onValueChange={(v) => setEngineSettings({ multiPv: v[0] })} min={1} max={5} step={1} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
