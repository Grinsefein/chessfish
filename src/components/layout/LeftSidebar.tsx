import React from 'react';
import { useEngineStore } from '@/store/engineStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sword,
  Activity,
  Download,
  BookOpen,
  Cpu,
  History,
  Settings
} from 'lucide-react';

interface ExtraNavItem {
  id: string;
  label: string;
  icon: any;
  onClick: () => void;
  active?: boolean;
}

interface LeftSidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  onOpenBotMatch: () => void;
  onOpenImport: () => void;
  onOpenSettings?: () => void;
  extraItems?: ExtraNavItem[];
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeView,
  onViewChange,
  onOpenBotMatch,
  onOpenImport,
  onOpenSettings,
  extraItems = []
}) => {
  const engineStore = useEngineStore();
  const {
    status,
    selectedEngine,
    selectedEngineVersion,
    cloudRuntime,
    threads,
    hashSize,
  } = engineStore;

  const engineLabel = selectedEngine === 'cloud'
    ? `${cloudRuntime.engineVersion} • ${threads}T • ${hashSize}MB`
    : `${selectedEngineVersion} • ${threads}T • ${hashSize}MB`;

  const NavItem = ({ 
    icon: Icon, 
    label, 
    view, 
    onClick,
    badge
  }: { 
    icon: any, 
    label: string, 
    view?: string,
    onClick?: () => void,
    badge?: string
  }) => {
    const isActive = view && activeView === view;
    return (
      <button
        onClick={() => {
          if (view) onViewChange(view);
          onClick?.();
        }}
        className={cn(
          "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-black transition-all border-2 uppercase tracking-wider",
          isActive
            ? "bg-zinc-800 border-zinc-700 text-white shadow-[0_4px_0_0_#09090b] translate-y-[-2px]"
            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900"
        )}
      >
        <Icon size={18} className={cn(isActive ? "text-primary" : "text-zinc-600")} />
        <span className="flex-1 text-left">{label}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-black">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-zinc-950 border-r-2 border-zinc-900 overflow-hidden shrink-0 font-sans">
        {/* Simple Brand Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary border-2 border-primary flex items-center justify-center shadow-[0_4px_0_0_#4a6728]">
              <Sword className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white leading-none uppercase tracking-tighter">Chess<span className="text-primary">Fish</span></h1>
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1">v2.0 PRO</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-10 custom-scrollbar">
          <div className="space-y-2">
            <p className="px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Modes</p>
            <NavItem icon={Sword} label="Play vs Bot" view="play" onClick={onOpenBotMatch} />
            <NavItem icon={Activity} label="Analysis" view="analyze" />
          </div>

          <div className="space-y-2">
            <p className="px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4">Tools</p>
            <NavItem icon={BookOpen} label="Openings" view="explorer" />
            <NavItem icon={History} label="History" view="library" />
            <NavItem icon={Download} label="Import" view="upload" onClick={onOpenImport} />
            {extraItems.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-black transition-all border-2 uppercase tracking-wider",
                  item.active
                    ? "bg-zinc-800 border-zinc-700 text-white shadow-[0_4px_0_0_#09090b] translate-y-[-2px]"
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900"
                )}
              >
                <item.icon size={18} className={cn(item.active ? "text-primary" : "text-zinc-600")} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-2 pt-4">
            <div className={cn(
              "p-5 rounded-2xl border-2 shadow-[0_4px_0_0_#09090b]",
              status === 'ready' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-950 border-zinc-900"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-2 h-2 rounded-full", status === 'ready' ? "bg-green-500 animate-pulse" : "bg-zinc-700")} />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{status === 'ready' ? 'Online' : 'Offline'}</span>
                </div>
                <Cpu size={14} className="text-zinc-700" />
              </div>
              
              <div className="text-[10px] font-black text-zinc-600 mb-5 uppercase tracking-wider">
                {selectedEngine === 'cloud' ? `Cloud • ${engineLabel}` : `Local • ${engineLabel}`}
              </div>

              <Button 
                variant={status === 'ready' ? "outline" : "default"}
                size="sm"
                onClick={() => engineStore.status === 'ready' ? engineStore.shutdownEngine() : engineStore.bootEngine()}
                className="w-full h-10 rounded-xl font-black text-[10px]"
              >
                {status === 'ready' ? 'Restart' : 'Boot'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-zinc-900">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all border-2 border-transparent font-black uppercase text-sm tracking-wider"
          >
            <Settings size={18} />
            <span className="flex-1 text-left">Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t-2 border-zinc-900 z-50 font-sans">
        <div className="flex items-center justify-around py-2 px-1 overflow-x-auto">
          <button
            onClick={() => { onViewChange('play'); onOpenBotMatch(); }}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all min-w-[64px] touch-manipulation",
              activeView === 'play' ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Sword size={20} className={cn(activeView === 'play' ? "text-primary" : "text-zinc-600")} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-1">Play</span>
          </button>
          <button
            onClick={() => onViewChange('analyze')}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all min-w-[64px] touch-manipulation",
              activeView === 'analyze' ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Activity size={20} className={cn(activeView === 'analyze' ? "text-primary" : "text-zinc-600")} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-1">Analyze</span>
          </button>
          <button
            onClick={onOpenImport}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all min-w-[64px] touch-manipulation",
              activeView === 'upload' ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Download size={20} className={cn(activeView === 'upload' ? "text-primary" : "text-zinc-600")} />
            <span className="text-[9px] font-black uppercase tracking-wider mt-1">Import</span>
          </button>
          {extraItems.map(item => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all min-w-[64px] touch-manipulation",
                item.active ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
              )}
            >
              <item.icon size={20} className={cn(item.active ? "text-primary" : "text-zinc-600")} />
              <span className="text-[9px] font-black uppercase tracking-wider mt-1">{item.label.slice(0, 6)}</span>
            </button>
          ))}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-all min-w-[64px] text-zinc-500 hover:bg-zinc-900/50 touch-manipulation"
          >
            <Settings size={20} className="text-zinc-600" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </>
  );
};
