import React, { useState } from 'react';
import { useEngineStore, ENGINE_VERSIONS } from '@/store/engineStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  Settings2,
  Play,
  Square,
  ArrowLeft,
  Server,
  SlidersHorizontal,
  Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EngineSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('config');
  const engineStore = useEngineStore();
  const initEngineStore = useEngineStore((state) => state.init);
  const refreshCloudSnapshot = useEngineStore((state) => state.refreshCloudSnapshot);
  const subscribeToCloudLogs = useEngineStore((state) => state.subscribeToCloudLogs);

  React.useEffect(() => {
    initEngineStore();
    refreshCloudSnapshot();
    subscribeToCloudLogs();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCloudSnapshot();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [initEngineStore, refreshCloudSnapshot, subscribeToCloudLogs]);
  
  const {
    status,
    statusMessage,
    selectedEngine,
    selectedEngineVersion,
    cloudRuntime,
    threads,
    hashSize,
    energySavingMode,
    isRefreshingSnapshot,
    lastHydratedAt,
    commandLogs,
    setEngineSettings,
    setEnergySavingMode,
    analysisMode,
    maxDepth,
    maxTimePerMove,
    setAnalysisMode,
    setMaxDepth,
    setMaxTimePerMove,
    setEngineVersion,
    clearLogs,
  } = engineStore;

  const effectiveVersion = selectedEngine === 'cloud' ? cloudRuntime.engineVersion : selectedEngineVersion;
  const effectiveStatusMessage = selectedEngine === 'cloud' && isRefreshingSnapshot
    ? 'Refreshing backend state...'
    : statusMessage;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <header className="h-14 lg:h-16 border-b border-white/5 bg-zinc-950 flex items-center px-4 lg:px-8 shrink-0 relative z-10">
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
              Shared cloud runtime plus device-local engine modes
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1400px] mx-auto w-full relative z-0">
        {/* Sidebar Navigation - Desktop */}
        <div className="hidden lg:flex w-72 border-r border-white/5 bg-zinc-950 flex-col shrink-0">
          {/* Header Section */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Settings</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-0.5">Configuration Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => setActiveTab('config')}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-200 tactile-btn border",
                activeTab === 'config'
                  ? "bg-zinc-800 border-white/10 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", activeTab === 'config' ? "bg-white/10 text-primary" : "bg-zinc-900 text-zinc-500")}>
                <SlidersHorizontal size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black uppercase tracking-wide">Config</div>
                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide truncate mt-0.5">
                  Version & Analysis
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('backend')}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-200 tactile-btn border",
                activeTab === 'backend'
                  ? "bg-zinc-800 border-white/10 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", activeTab === 'backend' ? "bg-white/10 text-primary" : "bg-zinc-900 text-zinc-500")}>
                <Server size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black uppercase tracking-wide">Backend</div>
                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide truncate mt-0.5">
                  Cloud Status & Logs
                </div>
              </div>
            </button>
          </div>

          {/* Status Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-4 rounded-3xl chunky-card">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                status === 'ready' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                status === 'booting' ? 'bg-amber-500 animate-pulse' :
                status === 'error' ? 'bg-red-500' : 'bg-zinc-600'
              )} />
              <div className="min-w-0">
                <div className="text-[11px] font-black text-white uppercase tracking-wider truncate">
                  {status === 'ready' ? 'Engine Online' : status === 'booting' ? 'Connecting...' : status === 'error' ? 'Connection Error' : 'Offline'}
                </div>
                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide truncate mt-0.5">
                  {cloudRuntime.engineVersion}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 relative">
          
          {/* Mobile Tabs */}
          <div className="lg:hidden w-full border-b border-white/5 bg-zinc-950 p-2 shrink-0 flex gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider tactile-btn transition-all border",
                activeTab === 'config' ? "bg-zinc-800 text-white border-white/10" : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"
              )}
            >
              <SlidersHorizontal size={14} /> Config
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider tactile-btn transition-all border",
                activeTab === 'backend' ? "bg-zinc-800 text-white border-white/10" : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"
              )}
            >
              <Server size={14} /> Backend
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-10 xl:p-14 custom-scrollbar relative">
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="max-w-[1000px] mx-auto relative z-10 space-y-8 lg:space-y-10">
              
              {activeTab === 'config' && (
                <div className="space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
                      <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Engine Version</Label>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {ENGINE_VERSIONS.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => setEngineVersion(version.id)}
                          className={cn(
                            "group p-5 lg:p-6 rounded-3xl border transition-all text-left",
                            effectiveVersion === version.id
                              ? 'border-primary/50 bg-primary/10 tactile-btn'
                              : 'border-white/5 bg-zinc-900 hover:border-white/10 hover:bg-zinc-800 tactile-btn'
                          )}
                        >
                          <div className={cn("text-lg font-black uppercase tracking-tight transition-colors", effectiveVersion === version.id ? 'text-primary' : 'text-white group-hover:text-zinc-200')}>{version.label}</div>
                          <div className="text-xs text-zinc-500 font-medium mt-1.5">{version.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="p-6 lg:p-8 rounded-3xl chunky-card space-y-5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-black text-zinc-400 uppercase tracking-wider">Threads</Label>
                        <span className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-lg border border-primary/20">{threads}</span>
                      </div>
                      <Slider value={[threads]} onValueChange={(v) => setEngineSettings({ threads: v[0] })} min={1} max={8} step={1} className="py-2" />
                      <div className="text-xs text-zinc-500 font-medium">CPU threads for engine calculation</div>
                    </div>
                    <div className="p-6 lg:p-8 rounded-3xl chunky-card space-y-5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-black text-zinc-400 uppercase tracking-wider">Hash Memory</Label>
                        <span className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-lg border border-primary/20">{hashSize}MB</span>
                      </div>
                      <Slider value={[hashSize]} onValueChange={(v) => setEngineSettings({ hashSize: v[0] })} min={16} max={1024} step={16} className="py-2" />
                      <div className="text-xs text-zinc-500 font-medium">Transposition table size</div>
                    </div>
                  </div>

                  <div className="p-6 lg:p-8 rounded-3xl chunky-card flex items-center justify-between group">
                    <div>
                      <div className="text-base font-black text-white uppercase tracking-wide group-hover:text-primary transition-colors">Energy Saving Mode</div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">Reduce CPU usage when idle</div>
                    </div>
                    <Switch checked={energySavingMode} onCheckedChange={setEnergySavingMode} className="scale-125" />
                  </div>

                  <div className="p-6 lg:p-8 rounded-3xl chunky-card space-y-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-black text-zinc-400 uppercase tracking-wider">Multi-PV Lines</Label>
                      <span className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-lg border border-primary/20">{engineStore.multiPv}</span>
                    </div>
                    <Slider value={[engineStore.multiPv]} onValueChange={(v) => setEngineSettings({ multiPv: v[0] })} min={1} max={5} step={1} className="py-2" />
                    <div className="text-xs text-zinc-500 font-medium">Number of principal variations to calculate</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
                      <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Analysis Mode</Label>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <button onClick={() => setAnalysisMode('depth')} className={cn("group p-6 lg:p-8 rounded-3xl border transition-all text-left min-h-[120px]", analysisMode === 'depth' ? 'border-primary/50 bg-primary/10 tactile-btn' : 'border-white/5 bg-zinc-900 hover:border-white/10 hover:bg-zinc-800 tactile-btn')}>
                        <div className={cn("text-xl font-black uppercase tracking-tight transition-colors", analysisMode === 'depth' ? 'text-primary' : 'text-white group-hover:text-zinc-200')}>Depth</div>
                        <div className="text-xs text-zinc-500 font-medium mt-2">Fixed search depth</div>
                      </button>
                      <button onClick={() => setAnalysisMode('time')} className={cn("group p-6 lg:p-8 rounded-3xl border transition-all text-left min-h-[120px]", analysisMode === 'time' ? 'border-primary/50 bg-primary/10 tactile-btn' : 'border-white/5 bg-zinc-900 hover:border-white/10 hover:bg-zinc-800 tactile-btn')}>
                        <div className={cn("text-xl font-black uppercase tracking-tight transition-colors", analysisMode === 'time' ? 'text-primary' : 'text-white group-hover:text-zinc-200')}>Time</div>
                        <div className="text-xs text-zinc-500 font-medium mt-2">Fixed time limit</div>
                      </button>
                    </div>
                  </div>

                  {analysisMode === 'depth' ? (
                    <div className="p-6 lg:p-8 rounded-3xl chunky-card space-y-5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-black text-zinc-400 uppercase tracking-wider">Max Search Depth</Label>
                        <span className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-lg border border-primary/20">{maxDepth}</span>
                      </div>
                      <Slider value={[maxDepth]} onValueChange={(v) => setMaxDepth(v[0])} min={10} max={30} step={1} className="py-2" />
                    </div>
                  ) : (
                    <div className="p-6 lg:p-8 rounded-3xl chunky-card space-y-5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-black text-zinc-400 uppercase tracking-wider">Max Time per Move</Label>
                        <span className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-lg border border-primary/20">{maxTimePerMove}s</span>
                      </div>
                      <Slider value={[maxTimePerMove]} onValueChange={(v) => setMaxTimePerMove(v[0])} min={1} max={30} step={1} className="py-2" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'backend' && (
                <div className="space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={cn(
                    "p-6 lg:p-8 rounded-3xl chunky-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6",
                    status === 'ready' ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]' :
                    status === 'booting' ? 'border-amber-500/30' :
                    status === 'error' ? 'border-red-500/30' : ''
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-4 h-4 rounded-full shrink-0 border-2",
                        status === 'ready' ? 'bg-green-500 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : status === 'booting' ? 'bg-amber-500 border-amber-400 animate-pulse' : status === 'error' ? 'bg-red-500 border-red-400' : 'bg-zinc-600 border-zinc-500'
                      )} />
                      <div>
                        <div className="text-xl font-black text-white uppercase tracking-wide">
                          {status === 'ready' ? 'Engine Active' : status === 'booting' ? 'Booting...' : status === 'error' ? 'Connection Error' : 'Offline'}
                        </div>
                        <div className="text-sm text-zinc-400 font-medium mt-1">{effectiveStatusMessage}</div>
                      </div>
                    </div>
                    
                    {status === 'offline' || status === 'error' ? (
                      <Button onClick={() => engineStore.bootEngine()} size="lg" className="bg-green-600 hover:bg-green-500 text-white font-black px-8 rounded-2xl border-0 h-12 tactile-btn w-full sm:w-auto text-sm">
                        <Play className="w-5 h-5 mr-2" /> Start Engine
                      </Button>
                    ) : (
                      <Button onClick={() => engineStore.shutdownEngine()} size="lg" variant="outline" className="border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 font-black px-8 rounded-2xl h-12 tactile-btn w-full sm:w-auto text-sm">
                        <Square className="w-5 h-5 mr-2" /> Stop
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-5 lg:p-6 rounded-3xl chunky-card">
                      <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Runtime</div>
                      <div className="text-lg font-black text-white uppercase tracking-tight mt-2">
                        {cloudRuntime.engine} <span className="text-zinc-600">/</span> {cloudRuntime.engineVersion}
                      </div>
                    </div>
                    <div className="p-5 lg:p-6 rounded-3xl chunky-card">
                      <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Status</div>
                      <div className="text-lg font-black text-white uppercase tracking-tight mt-2 flex items-center gap-2">
                        {isRefreshingSnapshot ? 'Syncing...' : lastHydratedAt ? 'Connected' : 'Pending'}
                      </div>
                    </div>
                    <div className="p-5 lg:p-6 rounded-3xl chunky-card">
                      <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Binary Path</div>
                      <div className="text-sm font-mono text-zinc-400 mt-2 truncate bg-zinc-950/50 p-2 rounded-xl">
                        {cloudRuntime.path}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
                      <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Active Runtime</Label>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                    </div>
                    <div className="p-6 lg:p-8 rounded-3xl bg-primary/10 border border-primary/20 tactile-btn">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                          <Cpu className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-black text-white text-lg uppercase tracking-wide">Stockfish Cloud</div>
                          <div className="text-xs text-zinc-400 font-medium mt-1">
                            Server-side engine with shared runtime
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Command Output Log */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-px bg-gradient-to-r from-transparent to-zinc-800" />
                        <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Engine Logs</Label>
                      </div>
                      {commandLogs.length > 0 && (
                        <button
                          onClick={() => void clearLogs()}
                          className="text-xs text-zinc-500 hover:text-white font-bold uppercase tracking-wider transition-colors bg-zinc-900 px-3 py-1 rounded-lg border border-white/5"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="chunky-card rounded-3xl overflow-hidden bg-zinc-950/50 shadow-inner">
                      <div className="p-6 h-64 overflow-y-auto custom-scrollbar font-mono text-xs">
                        {commandLogs.length === 0 ? (
                          <div className="text-zinc-600 italic text-center py-10 font-sans text-sm">
                            {selectedEngine === 'cloud' ? 'No engine output yet.' : 'Boot the engine to see command logs.'}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {commandLogs.map((log, index) => (
                              <div key={index} className="text-zinc-400 break-all hover:text-white transition-colors">
                                <span className="text-zinc-700 mr-3 select-none">{String(index + 1).padStart(3, '0')}</span>{log}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
