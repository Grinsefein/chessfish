import React, { useState } from 'react';
import { useEngineStore, ENGINES, type EngineVersion, type AnimationSpeed } from '@/store/engineStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose 
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
  Zap,
  X,
  Play,
  Square,
  Cloud,
  Monitor,
  RotateCcw
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
    arrowColorsByStrength,
    setEnlargePieceOnDrag,
    setAnimationSpeed,
    setDrawArrows,
    setArrowColorsByStrength,
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
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 rounded-[2.5rem] border-white/10 glass-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-8 pb-6 border-b border-white/5 shrink-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-xl shadow-primary/20 premium-gradient">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">System Cockpit</DialogTitle>
                <DialogDescription className="text-zinc-500 font-medium">
                  Deep configuration for the Stockfish engine and UI
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="rounded-full h-10 w-10 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="h-5 w-5 text-zinc-400" />
            </DialogClose>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-white/5 bg-white/[0.02] p-4 shrink-0">
            <TabsList className="flex flex-col h-auto bg-transparent gap-2">
              {[
                { value: 'engine', icon: Cpu, label: 'Engine' },
                { value: 'visuals', icon: Palette, label: 'Visuals' },
                { value: 'key-elements', icon: Sparkles, label: 'Pro Features', badge: 'PRO' },
                { value: 'analysis', icon: BarChart3, label: 'Analysis' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="w-full justify-start gap-3 px-5 py-4 h-auto data-[state=active]:bg-primary rounded-[1.25rem] text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-primary/30 text-sm font-black transition-all active:scale-95 text-left"
                >
                  <tab.icon size={20} className={cn(activeTab === tab.value ? "text-white" : "text-zinc-500")} />
                  <span className="flex-1">{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500 text-white font-black">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            
            {/* Engine Tab */}
            <TabsContent value="engine" className="m-0 space-y-8">
              <div className={cn(
                "p-6 rounded-3xl border flex items-center justify-between relative overflow-hidden",
                status === 'ready' ? 'bg-green-500/5 border-green-500/20' : 
                status === 'booting' ? 'bg-amber-500/5 border-amber-500/20' :
                status === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'
              )}>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    status === 'ready' ? 'bg-green-500' : status === 'booting' ? 'bg-amber-500' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'
                  )} />
                  <div>
                    <div className="text-lg font-black text-white uppercase tracking-tight">
                      {status === 'ready' ? 'Engine Active' : status === 'booting' ? 'Booting...' : status === 'error' ? 'Fault' : 'Offline'}
                    </div>
                    <div className="text-xs text-zinc-500 font-medium">{statusMessage}</div>
                  </div>
                </div>
                
                {status === 'offline' || status === 'error' ? (
                  <Button onClick={() => engineStore.bootEngine()} className="bg-green-500 hover:bg-green-600 text-white font-black px-6 rounded-xl">
                    <Play className="w-4 h-4 mr-2" /> BOOT
                  </Button>
                ) : (
                  <Button onClick={() => engineStore.shutdownEngine()} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-black px-6 rounded-xl">
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
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                        selectedEngine === engine.id ? 'bg-primary/10 border-primary shadow-xl shadow-primary/5' : 'bg-white/5 border-transparent hover:border-white/10'
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", engine.isCloud ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400')}>
                        {engine.isCloud ? <Cloud size={24} /> : <Monitor size={24} />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-black text-white text-base uppercase tracking-tight">{engine.name}</div>
                        <div className="text-xs text-zinc-500 font-medium">{engine.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Threads</Label>
                    <span className="text-sm font-black text-primary">{threads}</span>
                  </div>
                  <Slider value={[threads]} onValueChange={(v) => setEngineSettings({ threads: v[0] })} min={1} max={8} step={1} />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hash Memory</Label>
                    <span className="text-sm font-black text-primary">{hashSize}MB</span>
                  </div>
                  <Slider value={[hashSize]} onValueChange={(v) => setEngineSettings({ hashSize: v[0] })} min={16} max={1024} step={16} />
                </div>
              </div>
            </TabsContent>

            {/* Visuals Tab */}
            <TabsContent value="visuals" className="m-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Enlarge on Drag', value: enlargePieceOnDrag, setter: setEnlargePieceOnDrag, desc: 'Scale pieces while moving' },
                  { label: 'Draw Arrows', value: drawArrows, setter: setDrawArrows, desc: 'Show suggested moves' },
                  { label: 'Notation', value: figurineNotation, setter: setFigurineNotation, desc: 'Use figurine icons' },
                  { label: 'Sound', value: soundEnabled, setter: setSoundEnabled, desc: 'Play match audio' },
                ].map((item) => (
                  <div key={item.label} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                    <div>
                      <div className="text-sm font-black text-white uppercase tracking-tight">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 font-medium">{item.desc}</div>
                    </div>
                    <Switch checked={item.value} onCheckedChange={item.setter} />
                  </div>
                ))}
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
                  <div key={item.key} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/[0.08] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Sparkles size={18} className="text-purple-400" />
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
                <button onClick={() => setAnalysisMode('depth')} className={cn("p-6 rounded-3xl border-2 transition-all text-left", analysisMode === 'depth' ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5')}>
                  <div className="text-lg font-black text-white uppercase tracking-tight">Depth</div>
                  <div className="text-xs text-zinc-500">Fixed search depth</div>
                </button>
                <button onClick={() => setAnalysisMode('time')} className={cn("p-6 rounded-3xl border-2 transition-all text-left", analysisMode === 'time' ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5')}>
                  <div className="text-lg font-black text-white uppercase tracking-tight">Time</div>
                  <div className="text-xs text-zinc-500">Fixed time limit</div>
                </button>
              </div>
              
              <div className="space-y-4 p-6 rounded-3xl bg-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Multi-PV Lines</Label>
                  <span className="text-sm font-black text-primary">{engineStore.multiPv}</span>
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
