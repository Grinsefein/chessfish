import React, { useState } from 'react';
import { useEngineStore, type ActiveView } from '@/store/engineStore';
import { cn } from '@/lib/utils';
import { 
  Sword, 
  Microscope, 
  Download, 
  BookOpen, 
  Settings,
} from 'lucide-react';

const navItems: { id: ActiveView; icon: React.ReactNode; label: string; emoji: string }[] = [
  { id: 'play', icon: <Sword size={20} />, label: 'Play', emoji: '⚔️' },
  { id: 'analyze', icon: <Microscope size={20} />, label: 'Analyze', emoji: '🔬' },
  { id: 'import', icon: <Download size={20} />, label: 'Import', emoji: '📥' },
  { id: 'explorer', icon: <BookOpen size={20} />, label: 'Explorer', emoji: '📚' },
];

interface SidebarProps {
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick }) => {
  const { activeView, setActiveView } = useEngineStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <nav 
      className={cn(
        "h-full flex flex-col py-6 gap-2 border-r-2 border-zinc-900 bg-zinc-950 transition-all duration-300 ease-out overflow-hidden",
        isExpanded ? "w-64 px-4" : "w-20 px-2"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center mb-8 transition-all duration-300",
        isExpanded ? "px-2" : "justify-center"
      )}>
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-2xl text-white shadow-[0_4px_0_0_#4a6728] shrink-0">
          ♟
        </div>
        {isExpanded && (
          <div className="ml-4 font-black text-xl text-white whitespace-nowrap overflow-hidden tracking-tight uppercase">
            <span className="text-primary">Stock</span>fish
          </div>
        )}
      </div>

      {/* Top Navigation */}
      <div className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative border-2",
                isActive 
                  ? "bg-zinc-800 border-zinc-700 text-white shadow-[0_4px_0_0_#09090b] translate-y-[-2px]"
                  : "text-zinc-500 border-transparent hover:bg-zinc-900 hover:text-zinc-300",
                !isExpanded && "justify-center px-0"
              )}
            >
              <span className={cn(
                "transition-transform duration-200",
                isActive && "scale-110"
              )}>
                {isExpanded ? <span className="text-xl">{item.emoji}</span> : item.icon}
              </span>
              
              {isExpanded && (
                <span className={cn(
                  "font-black text-sm whitespace-nowrap transition-opacity duration-200 uppercase tracking-wider",
                  isActive ? "text-white" : "text-zinc-500"
                )}>
                  {item.label}
                </span>
              )}

              {/* Active indicator pill - simplified to a dot/bar */}
              {isActive && isExpanded && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full" />
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-800 text-white text-xs font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 border-2 border-zinc-700 shadow-lg uppercase tracking-widest">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Settings */}
      <div className={cn(
        "mt-auto pt-6 border-t-2 border-zinc-900",
        !isExpanded && "flex justify-center"
      )}>
        <button
          onClick={onSettingsClick}
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 group border-2 border-transparent",
            !isExpanded && "justify-center px-0"
          )}
        >
          <span className="transition-transform duration-200 group-hover:rotate-45">
            {isExpanded ? <span className="text-xl">⚙️</span> : <Settings size={20} />}
          </span>
          
          {isExpanded && (
            <span className="font-black text-sm whitespace-nowrap text-zinc-500 uppercase tracking-wider">
              Settings
            </span>
          )}

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-800 text-white text-xs font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 border-2 border-zinc-700 shadow-lg uppercase tracking-widest">
              Settings
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
