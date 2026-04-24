import React, { useState, useEffect } from 'react';
import { useEngineStore } from '@/store/engineStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sword,
  Activity,
  Download,
  BookOpen,
  Cpu,
  History,
  Settings,
  Menu,
  X,
  Monitor,
  CircleDot
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTabletSidebarOpen, setIsTabletSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const engineStore = useEngineStore();

  // Handle responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsTabletSidebarOpen(false);
  }, [activeView]);
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
          "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-black transition-all uppercase tracking-wider tactile-btn",
          isActive
            ? "bg-zinc-800 border-white/10 text-white"
            : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900 border"
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
                  "w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-black transition-all uppercase tracking-wider tactile-btn",
                  item.active
                    ? "bg-zinc-800 border-white/10 text-white"
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900 border"
                )}
              >
                <item.icon size={18} className={cn(item.active ? "text-primary" : "text-zinc-600")} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-2 pt-4">
            <div className={cn(
              "p-5 chunky-card",
              status === 'ready' ? "bg-zinc-900" : "bg-zinc-950 border-white/5"
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
                className="w-full h-10 rounded-xl font-black text-[10px] tactile-btn"
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

      {/* Tablet Header with Hamburger */}
      <AnimatePresence>
        {isTablet && (
          <motion.header 
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-950 border-b-2 border-zinc-900 z-40 flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsTabletSidebarOpen(!isTabletSidebarOpen)}
                className="p-2 rounded-lg bg-zinc-900 border-2 border-zinc-800 hover:bg-zinc-800 transition-colors"
              >
                {isTabletSidebarOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-zinc-400" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sword className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-white uppercase tracking-tight text-sm">Chess<span className="text-primary">Fish</span></span>
              </div>
            </div>
            
            {/* Engine Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", status === 'ready' ? "bg-green-500 animate-pulse" : "bg-zinc-600")} />
              <Cpu size={16} className="text-zinc-600" />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Tablet Sidebar - Slide out */}
      <AnimatePresence>
        {isTablet && isTabletSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTabletSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar Panel */}
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-14 left-0 bottom-0 w-72 bg-zinc-950 border-r-2 border-zinc-900 z-50 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
                <div className="space-y-2">
                  <p className="px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-3">Modes</p>
                  <NavItem icon={Sword} label="Play vs Bot" view="play" onClick={onOpenBotMatch} />
                  <NavItem icon={Activity} label="Analysis" view="analyze" />
                </div>

                <div className="space-y-2">
                  <p className="px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-3">Tools</p>
                  <NavItem icon={BookOpen} label="Openings" view="explorer" />
                  <NavItem icon={History} label="History" view="library" />
                  <NavItem icon={Download} label="Import" view="upload" onClick={onOpenImport} />
                  {extraItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { item.onClick(); setIsTabletSidebarOpen(false); }}
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

                {/* Engine Status Card */}
                <div className={cn(
                  "p-4 chunky-card",
                  status === 'ready' ? "bg-zinc-900" : "bg-zinc-950 border-white/5"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("w-2 h-2 rounded-full", status === 'ready' ? "bg-green-500 animate-pulse" : "bg-zinc-700")} />
                    <span className="text-[10px] font-black text-zinc-500 uppercase">{status === 'ready' ? 'Engine Online' : 'Engine Offline'}</span>
                  </div>
                  <Button 
                    variant={status === 'ready' ? "outline" : "default"}
                    size="sm"
                    onClick={() => engineStore.status === 'ready' ? engineStore.shutdownEngine() : engineStore.bootEngine()}
                    className="w-full h-10 rounded-xl font-black text-[10px] tactile-btn"
                  >
                    {status === 'ready' ? 'Restart' : 'Boot Engine'}
                  </Button>
                </div>
              </div>

              <div className="p-4 border-t-2 border-zinc-900">
                <button
                  onClick={() => { onOpenSettings?.(); setIsTabletSidebarOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all border border-transparent font-black uppercase text-sm tracking-wider tactile-btn"
                >
                  <Settings size={18} />
                  <span className="flex-1 text-left">Settings</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation - Redesigned */}
      <nav className="lg:hidden md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t-2 border-zinc-900 z-50 font-sans safe-area-pb">
        <div className="flex items-center justify-around py-2 px-1">
          <button
            onClick={() => { onViewChange('play'); onOpenBotMatch(); }}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] touch-manipulation",
              activeView === 'play' ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Sword size={22} className={cn(activeView === 'play' ? "text-primary" : "text-zinc-600")} />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Play</span>
          </button>
          
          <button
            onClick={() => onViewChange('analyze')}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] touch-manipulation",
              activeView === 'analyze' ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Activity size={22} className={cn(activeView === 'analyze' ? "text-primary" : "text-zinc-600")} />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Analyze</span>
          </button>
          
          {/* Engine Status - Center */}
          <button
            onClick={() => engineStore.status === 'ready' ? engineStore.shutdownEngine() : engineStore.bootEngine()}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-2xl transition-all touch-manipulation -mt-4 border-2 shadow-lg",
              status === 'ready' 
                ? "bg-green-500/20 border-green-500/50 text-green-400" 
                : "bg-zinc-800 border-zinc-700 text-zinc-500"
            )}
          >
            <CircleDot size={24} className={cn(status === 'ready' && "animate-pulse")} />
          </button>
          
          <button
            onClick={onOpenImport}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] touch-manipulation",
              activeView === 'upload' ? "text-primary bg-zinc-900" : "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Download size={22} className={cn(activeView === 'upload' ? "text-primary" : "text-zinc-600")} />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Import</span>
          </button>
          
          <button
            onClick={onOpenSettings}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] touch-manipulation",
              "text-zinc-500 hover:bg-zinc-900/50"
            )}
          >
            <Settings size={22} className="text-zinc-600" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
