import React, { useState } from 'react';
import { useEngineStore, ENGINE_VERSIONS } from '@/store/engineStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState('backend');
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
              Shared cloud runtime plus device-local engine modes
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1400px] mx-auto w-full">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 overflow-hidden bg-zinc-900 lg:flex-row flex-col"
          dir="ltr"
        >
          {/* Mobile Horizontal Tabs */}
          <div className="lg:hidden w-full border-b-2 border-zinc-800 bg-zinc-950 p-1.5 shrink-0">
            <TabsList className="flex h-auto bg-transparent gap-1.5 w-full border-0 shadow-none p-0">
              {[
                { value: 'config', icon: SlidersHorizontal, label: 'Config' },
                { value: 'backend', icon: Server, label: 'Backend' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 justify-center gap-1.5 px-2 py-2 h-auto data-[state=active]:bg-primary rounded-lg text-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-[0_2px_0_0_#4a6728] text-[11px] font-black transition-all active:translate-y-[1px] active:shadow-none uppercase tracking-wider border-2 border-transparent data-[state=active]:border-primary cursor-pointer touch-manipulation"
                >
                  <tab.icon size={14} className="shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:flex w-80 border-r-2 border-zinc-800 bg-zinc-950 flex-col shrink-0">
            {/* Header Section */}
            <div className="p-5 border-b-2 border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Engine Settings</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Configuration Panel</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 p-4 overflow-y-auto">
              <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full border-0 shadow-none p-0">
                {[
                  {
                    value: 'config',
                    icon: SlidersHorizontal,
                    label: 'Configuration',
                    description: 'Version, threads, memory & analysis'
                  },
                  {
                    value: 'backend',
                    icon: Server,
                    label: 'Backend',
                    description: 'Cloud engine status & logs'
                  },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-3 h-auto rounded-lg text-left transition-all duration-200",
                      "border border-transparent data-[state=active]:border-primary/50",
                      "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_3px_0_0_#4a6728]",
                      "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50",
                      "data-[state=active]:hover:bg-primary data-[state=active]:hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors",
                      "bg-zinc-900 data-[state=active]:bg-white/20"
                    )}>
                      <tab.icon size={18} className="shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black uppercase tracking-wide">{tab.label}</div>
                      <div className="text-[10px] text-zinc-500 data-[state=active]:text-white/70 font-bold uppercase tracking-wide truncate">
                        {tab.description}
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Status Footer */}
            <div className="p-4 border-t-2 border-zinc-800">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  status === 'ready' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' :
                  status === 'booting' ? 'bg-amber-500 animate-pulse' :
                  status === 'error' ? 'bg-red-500' : 'bg-zinc-600'
                )} />
                <div className="min-w-0">
                  <div className="text-[11px] font-black text-zinc-300 uppercase tracking-wide truncate">
                    {status === 'ready' ? 'Engine Online' : status === 'booting' ? 'Connecting...' : status === 'error' ? 'Connection Error' : 'Engine Offline'}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide truncate">
                    {cloudRuntime.engineVersion}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 xl:p-14 custom-scrollbar space-y-8 lg:space-y-10 bg-zinc-900">
            
            {/* Configuration Tab */}
            <TabsContent value="config" className="m-0 space-y-8 lg:space-y-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <Label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em]">Engine Version</Label>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {ENGINE_VERSIONS.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setEngineVersion(version.id)}
                      className={cn(
                        "group p-4 lg:p-6 rounded-xl border transition-all text-left",
                        effectiveVersion === version.id
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600/50 hover:bg-zinc-800/50'
                      )}
                    >
                      <div className={cn("text-base font-black uppercase tracking-tight transition-colors", effectiveVersion === version.id ? 'text-primary' : 'text-white group-hover:text-zinc-200')}>{version.label}</div>
                      <div className="text-[11px] text-zinc-500 font-medium mt-1">{version.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="p-5 lg:p-8 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Threads</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">{threads}</span>
                  </div>
                  <Slider value={[threads]} onValueChange={(v) => setEngineSettings({ threads: v[0] })} min={1} max={8} step={1} />
                  <div className="text-[11px] text-zinc-500 font-medium">CPU threads for engine calculation</div>
                </div>
                <div className="p-5 lg:p-8 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Hash Memory</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">{hashSize}MB</span>
                  </div>
                  <Slider value={[hashSize]} onValueChange={(v) => setEngineSettings({ hashSize: v[0] })} min={16} max={1024} step={16} />
                  <div className="text-[11px] text-zinc-500 font-medium">Transposition table size</div>
                </div>
              </div>

              <div className="p-5 lg:p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white uppercase tracking-wide">Energy Saving Mode</div>
                  <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Reduce CPU usage when idle</div>
                </div>
                <Switch checked={energySavingMode} onCheckedChange={setEnergySavingMode} />
              </div>

              <div className="p-5 lg:p-8 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Multi-PV Lines</Label>
                  <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">{engineStore.multiPv}</span>
                </div>
                <Slider value={[engineStore.multiPv]} onValueChange={(v) => setEngineSettings({ multiPv: v[0] })} min={1} max={5} step={1} />
                <div className="text-[11px] text-zinc-500 font-medium">Number of principal variations to calculate</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <Label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em]">Analysis Mode</Label>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <button onClick={() => setAnalysisMode('depth')} className={cn("group p-5 lg:p-8 rounded-xl border transition-all text-left min-h-[100px] lg:min-h-[120px]", analysisMode === 'depth' ? 'border-primary/50 bg-primary/5' : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600/50 hover:bg-zinc-800/50')}>
                    <div className={cn("text-lg font-black uppercase tracking-tight transition-colors", analysisMode === 'depth' ? 'text-primary' : 'text-white group-hover:text-zinc-200')}>Depth</div>
                    <div className="text-[11px] text-zinc-500 font-medium mt-1.5">Fixed search depth</div>
                  </button>
                  <button onClick={() => setAnalysisMode('time')} className={cn("group p-5 lg:p-8 rounded-xl border transition-all text-left min-h-[100px] lg:min-h-[120px]", analysisMode === 'time' ? 'border-primary/50 bg-primary/5' : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600/50 hover:bg-zinc-800/50')}>
                    <div className={cn("text-lg font-black uppercase tracking-tight transition-colors", analysisMode === 'time' ? 'text-primary' : 'text-white group-hover:text-zinc-200')}>Time</div>
                    <div className="text-[11px] text-zinc-500 font-medium mt-1.5">Fixed time limit</div>
                  </button>
                </div>
              </div>

              {analysisMode === 'depth' ? (
                <div className="p-5 lg:p-8 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Max Search Depth</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">{maxDepth}</span>
                  </div>
                  <Slider value={[maxDepth]} onValueChange={(v) => setMaxDepth(v[0])} min={10} max={30} step={1} />
                </div>
              ) : (
                <div className="p-5 lg:p-8 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-zinc-400 uppercase tracking-wider">Max Time per Move</Label>
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">{maxTimePerMove}s</span>
                  </div>
                  <Slider value={[maxTimePerMove]} onValueChange={(v) => setMaxTimePerMove(v[0])} min={1} max={30} step={1} />
                </div>
              )}
            </TabsContent>

            {/* Backend Tab */}
            <TabsContent value="backend" className="m-0 space-y-8 lg:space-y-10">
              <div className={cn(
                "p-5 lg:p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                status === 'ready' ? 'bg-green-500/5 border-green-500/30' :
                status === 'booting' ? 'bg-amber-500/5 border-amber-500/30' :
                status === 'error' ? 'bg-red-500/5 border-red-500/30' : 'bg-zinc-800/50 border-zinc-700/50'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full shrink-0",
                    status === 'ready' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'booting' ? 'bg-amber-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-zinc-600'
                  )} />
                  <div>
                    <div className="text-base font-black text-white uppercase tracking-wide">
                      {status === 'ready' ? 'Engine Active' : status === 'booting' ? 'Booting...' : status === 'error' ? 'Connection Error' : 'Offline'}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-medium mt-0.5">{effectiveStatusMessage}</div>
                  </div>
                </div>
                
                {status === 'offline' || status === 'error' ? (
                  <Button onClick={() => engineStore.bootEngine()} size="sm" className="bg-green-600 hover:bg-green-500 text-white font-black px-5 rounded-lg border-0 h-9">
                    <Play className="w-4 h-4 mr-2" /> Start Engine
                  </Button>
                ) : (
                  <Button onClick={() => engineStore.shutdownEngine()} size="sm" variant="outline" className="border-zinc-600 text-zinc-400 hover:text-white hover:bg-zinc-800 font-black px-5 rounded-lg h-9">
                    <Square className="w-4 h-4 mr-2" /> Stop
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="p-4 lg:p-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Runtime</div>
                  <div className="text-base font-black text-white uppercase tracking-tight mt-1.5">
                    {cloudRuntime.engine} <span className="text-zinc-500">/</span> {cloudRuntime.engineVersion}
                  </div>
                </div>
                <div className="p-4 lg:p-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Status</div>
                  <div className="text-base font-black text-white uppercase tracking-tight mt-1.5">
                    {isRefreshingSnapshot ? 'Syncing...' : lastHydratedAt ? 'Connected' : 'Pending'}
                  </div>
                </div>
                <div className="p-4 lg:p-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Binary Path</div>
                  <div className="text-xs font-mono text-zinc-400 mt-1.5 truncate">
                    {cloudRuntime.path}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <Label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em]">Active Runtime</Label>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="p-5 lg:p-6 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-black text-white text-sm uppercase tracking-wide">Stockfish Cloud</div>
                      <div className="text-[11px] text-zinc-500 font-medium mt-0.5">
                        Server-side engine with shared runtime
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Command Output Log */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-zinc-800" />
                    <Label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em]">Engine Logs</Label>
                  </div>
                  {commandLogs.length > 0 && (
                    <button
                      onClick={() => void clearLogs()}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="p-4 h-56 overflow-y-auto custom-scrollbar font-mono text-xs">
                    {commandLogs.length === 0 ? (
                      <div className="text-zinc-600 italic">
                        {selectedEngine === 'cloud' ? 'No engine output yet.' : 'Boot the engine to see command logs.'}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {commandLogs.map((log, index) => (
                          <div key={index} className="text-zinc-400 break-all hover:text-zinc-300 transition-colors">
                            <span className="text-zinc-600 mr-2">{index + 1}</span>{log}
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
