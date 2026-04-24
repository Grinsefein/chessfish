import React, { useState } from 'react';
import { useEngineStore, ENGINES } from '@/store/engineStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  Cpu, 
  Sparkles,
  BarChart3,
  Play,
  Square,
  Cloud,
  Monitor,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EngineSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('backend');
  const engineStore = useEngineStore();
  
  const {
    status,
    statusMessage,
    selectedEngine,
    threads,
    hashSize,
    energySavingMode,
    commandLogs,
    setEngineSettings,
    setEnergySavingMode,
    analysisMode,
    maxDepth,
    maxTimePerMove,
    setAnalysisMode,
    setMaxDepth,
    setMaxTimePerMove,
  } = engineStore;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <header className="h-14 lg:h-16 border-b-2 border-zinc-900 bg-zinc-950 flex items-center px-4 lg:px-8 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mr-4 lg:mr-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-black uppercase tracking-wider hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-3 lg:gap-5">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_0_0_#4a6728]">
            <Cpu className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase">Engine Settings</h1>
            <p className="text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:block">
              Server-side Stockfish engine configuration
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-1 overflow-hidden bg-zinc-900"
        >
          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:block w-64 border-r-2 border-zinc-800 bg-zinc-950 p-4 shrink-0 overflow-y-auto">
            <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full border-0 shadow-none p-0">
              {[
                { value: 'config', icon: Sparkles, label: 'Configuration' },
                { value: 'backend', icon: Cpu, label: 'Backend' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="w-full justify-start gap-4 px-5 py-4 h-auto data-[state=active]:bg-primary rounded-xl text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_0_0_#4a6728] text-sm font-black transition-all active:translate-y-[2px] active:shadow-none text-left uppercase tracking-wider border-2 border-transparent data-[state=active]:border-primary"
                >
                  <tab.icon size={20} className="shrink-0" />
                  <span className="flex-1 truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Mobile Horizontal Tabs */}
          <div className="lg:hidden w-full border-b-2 border-zinc-800 bg-zinc-950 p-2 shrink-0">
            <TabsList className="flex h-auto bg-transparent gap-2 w-full border-0 shadow-none p-0">
              {[
                { value: 'config', icon: Sparkles, label: 'Config' },
                { value: 'backend', icon: Cpu, label: 'Backend' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 justify-center gap-2 px-3 py-3 h-auto data-[state=active]:bg-primary rounded-xl text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_0_0_#4a6728] text-xs font-black transition-all active:translate-y-[2px] active:shadow-none uppercase tracking-wider border-2 border-transparent data-[state=active]:border-primary"
                >
                  <tab.icon size={16} className="shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar space-y-6 lg:space-y-8 bg-zinc-900">
            
            {/* Configuration Tab */}
            <TabsContent value="config" className="m-0 space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Threads</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{threads}</span>
                  </div>
                  <Slider value={[threads]} onValueChange={(v) => setEngineSettings({ threads: v[0] })} min={1} max={8} step={1} />
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">CPU threads for engine calculation</div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hash Memory</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{hashSize}MB</span>
                  </div>
                  <Slider value={[hashSize]} onValueChange={(v) => setEngineSettings({ hashSize: v[0] })} min={16} max={1024} step={16} />
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Transposition table size</div>
                </div>
              </div>

              <div className="p-4 lg:p-6 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-between shadow-[0_4px_0_0_#09090b]">
                <div>
                  <div className="text-sm font-black text-white uppercase tracking-tight">Energy Saving Mode</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Reduce CPU usage when idle</div>
                </div>
                <Switch checked={energySavingMode} onCheckedChange={setEnergySavingMode} />
              </div>

              <div className="space-y-5 p-4 lg:p-8 rounded-2xl bg-zinc-800 border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b]">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Multi-PV Lines</Label>
                  <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{engineStore.multiPv}</span>
                </div>
                <Slider value={[engineStore.multiPv]} onValueChange={(v) => setEngineSettings({ multiPv: v[0] })} min={1} max={5} step={1} />
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Number of principal variations to calculate</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <button onClick={() => setAnalysisMode('depth')} className={cn("p-4 lg:p-6 rounded-2xl border-2 transition-all text-left shadow-[0_4px_0_0_#09090b] min-h-[80px]", analysisMode === 'depth' ? 'border-primary bg-primary/10 translate-y-[-2px]' : 'border-zinc-700 bg-zinc-800')}>
                  <div className="text-lg font-black text-white uppercase tracking-tight">Depth</div>
                  <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Fixed search depth</div>
                </button>
                <button onClick={() => setAnalysisMode('time')} className={cn("p-4 lg:p-6 rounded-2xl border-2 transition-all text-left shadow-[0_4px_0_0_#09090b] min-h-[80px]", analysisMode === 'time' ? 'border-primary bg-primary/10 translate-y-[-2px]' : 'border-zinc-700 bg-zinc-800')}>
                  <div className="text-lg font-black text-white uppercase tracking-tight">Time</div>
                  <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Fixed time limit</div>
                </button>
              </div>

              {analysisMode === 'depth' ? (
                <div className="space-y-5 p-4 lg:p-8 rounded-2xl bg-zinc-800 border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b]">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max Search Depth</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{maxDepth}</span>
                  </div>
                  <Slider value={[maxDepth]} onValueChange={(v) => setMaxDepth(v[0])} min={10} max={30} step={1} />
                </div>
              ) : (
                <div className="space-y-5 p-4 lg:p-8 rounded-2xl bg-zinc-800 border-2 border-zinc-700 shadow-[0_4px_0_0_#09090b]">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Max Time per Move (s)</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{maxTimePerMove}s</span>
                  </div>
                  <Slider value={[maxTimePerMove]} onValueChange={(v) => setMaxTimePerMove(v[0])} min={1} max={30} step={1} />
                </div>
              )}
            </TabsContent>

            {/* Backend Tab */}
            <TabsContent value="backend" className="m-0 space-y-6 lg:space-y-8">
              <div className={cn(
                "p-4 lg:p-6 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between relative overflow-hidden gap-4",
                status === 'ready' ? 'bg-green-500/10 border-green-500/50' :
                status === 'booting' ? 'bg-amber-500/10 border-amber-500/50' :
                status === 'error' ? 'bg-red-500/10 border-red-500/50' : 'bg-zinc-800 border-zinc-700'
              )}>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "w-4 h-4 rounded-full shrink-0",
                    status === 'ready' ? 'bg-green-500' : status === 'booting' ? 'bg-amber-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'
                  )} />
                  <div>
                    <div className="text-base lg:text-lg font-black text-white uppercase tracking-tight">
                      {status === 'ready' ? 'Engine Active' : status === 'booting' ? 'Booting...' : status === 'error' ? 'Fault' : 'Offline'}
                    </div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{statusMessage}</div>
                  </div>
                </div>
                
                {status === 'offline' || status === 'error' ? (
                  <Button onClick={() => engineStore.bootEngine()} size="sm" className="bg-green-600 hover:bg-green-500 text-white font-black px-4 lg:px-6 rounded-xl border-green-700 shadow-[0_4px_0_0_#14532d] w-full sm:w-auto">
                    <Play className="w-4 h-4 mr-2" /> BOOT
                  </Button>
                ) : (
                  <Button onClick={() => engineStore.shutdownEngine()} size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10 font-black px-4 lg:px-6 rounded-xl shadow-[0_4px_0_0_#450a0a] w-full sm:w-auto">
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
                        "flex items-center gap-3 lg:gap-4 p-4 lg:p-5 rounded-2xl border-2 transition-all duration-300",
                        selectedEngine === engine.id
                          ? 'bg-zinc-800 border-primary shadow-[0_4px_0_0_#4a6728] translate-y-[-2px]'
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600 shadow-[0_4px_0_0_#09090b]'
                      )}
                    >
                      <div className={cn("w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center border-2 shrink-0",
                        selectedEngine === engine.id
                          ? (engine.isCloud ? 'bg-blue-500 text-white border-blue-600' : 'bg-purple-500 text-white border-purple-600')
                          : (engine.isCloud ? 'bg-zinc-900 text-blue-400 border-zinc-700' : 'bg-zinc-900 text-purple-400 border-zinc-700')
                      )}>
                        {engine.isCloud ? <Cloud size={24} /> : <Monitor size={24} />}
                      </div>
                      <div className="flex-1 text-left truncate">
                        <div className="font-black text-white text-sm lg:text-base uppercase tracking-tight truncate">{engine.name}</div>
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest truncate">{engine.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Command Output Log */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Engine Output</Label>
                  {commandLogs.length > 0 && (
                    <button
                      onClick={() => engineStore.clearLogs()}
                      className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-widest transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="bg-zinc-950 border-2 border-zinc-800 rounded-xl overflow-hidden shadow-[0_4px_0_0_#09090b]">
                  <div className="p-4 h-48 overflow-y-auto custom-scrollbar">
                    {commandLogs.length === 0 ? (
                      <div className="text-zinc-600 text-xs font-mono">
                        No output yet. Boot the engine to see command logs.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {commandLogs.map((log, index) => (
                          <div key={index} className="text-xs font-mono text-zinc-400 break-all">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
}
