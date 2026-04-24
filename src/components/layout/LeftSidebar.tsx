import React, { useState } from 'react';
import { useEngineStore, ENGINES } from '@/store/engineStore';
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

interface LeftSidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  onOpenBotMatch: () => void;
  onOpenImport: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeView,
  onViewChange,
  onOpenBotMatch,
  onOpenImport
}) => {
  const engineStore = useEngineStore();
  const {
    status,
    selectedEngine,
    threads,
    hashSize,
    selectEngine
  } = engineStore;

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
  }) => (
    <button
      onClick={() => {
        if (view) onViewChange(view);
        onClick?.();
      }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all",
        (view && activeView === view)
          ? "bg-zinc-800 text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
      )}
    >
      <Icon size={16} className={cn((view && activeView === view) ? "text-primary" : "text-zinc-600")} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <aside className="w-64 flex flex-col bg-zinc-950 border-r border-zinc-900 overflow-hidden shrink-0" style={{ backgroundColor: '#09090b' }}>
      {/* Simple Brand Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Sword className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none">ChessFish</h1>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">v2.0 PRO</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-6 space-y-8 custom-scrollbar">
        <div className="space-y-1">
          <p className="px-4 text-[9px] font-bold text-zinc-700 uppercase tracking-widest mb-3">Modes</p>
          <NavItem icon={Sword} label="Play vs Bot" view="play" onClick={onOpenBotMatch} />
          <NavItem icon={Activity} label="Analysis" view="analyze" />
        </div>

        <div className="space-y-1">
          <p className="px-4 text-[9px] font-bold text-zinc-700 uppercase tracking-widest mb-3">Tools</p>
          <NavItem icon={BookOpen} label="Openings" view="explorer" />
          <NavItem icon={History} label="History" view="library" />
          <NavItem icon={Download} label="Import" onClick={onOpenImport} />
        </div>

        <div className="px-2 pt-2">
          <div className={cn(
            "p-4 rounded-xl border",
            status === 'ready' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-950 border-zinc-900"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", status === 'ready' ? "bg-green-500" : "bg-zinc-600")} />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{status === 'ready' ? 'Online' : 'Offline'}</span>
              </div>
              <Cpu size={12} className="text-zinc-700" />
            </div>
            
            <div className="text-[9px] font-bold text-zinc-600 mb-4">
              {selectedEngine === 'cloud' ? 'Cloud' : 'Local'} • {threads}T • {hashSize}MB
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => engineStore.status === 'ready' ? engineStore.shutdownEngine() : engineStore.bootEngine()}
              className="w-full h-8 rounded-lg border-zinc-800 text-[9px] font-bold uppercase hover:bg-zinc-900"
            >
              {status === 'ready' ? 'Restart' : 'Boot'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-900">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all">
          <Settings size={16} />
          <span className="text-sm font-bold">Settings</span>
        </button>
      </div>
    </aside>
  );
};
