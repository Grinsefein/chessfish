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
        "h-full flex flex-col py-6 gap-2 border-r border-white/5 bg-zinc-950 transition-all duration-300 ease-out overflow-hidden",
        isExpanded ? "w-64 px-4" : "w-16 px-2"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center mb-6 transition-all duration-300",
        isExpanded ? "px-2" : "justify-center"
      )}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-primary/20 shrink-0">
          ♟
        </div>
        {isExpanded && (
          <div className="ml-3 font-bold text-white whitespace-nowrap overflow-hidden">
            <span className="text-primary">Fish</span>
          </div>
        )}
      </div>

      {/* Top Navigation */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-white/10 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5",
                !isExpanded && "justify-center px-2"
              )}
            >
              <span className={cn(
                "transition-transform duration-200",
                isActive && "scale-110"
              )}>
                {isExpanded ? item.emoji : item.icon}
              </span>
              
              {isExpanded && (
                <span className={cn(
                  "font-medium text-sm whitespace-nowrap transition-opacity duration-200",
                  isActive ? "text-white" : "text-zinc-400"
                )}>
                  {item.label}
                </span>
              )}

              {/* Active indicator pill */}
              {isActive && (
                <div className={cn(
                  "absolute bg-primary rounded-full transition-all duration-300",
                  isExpanded ? "left-0 w-1 h-8" : "left-0 w-1 h-6"
                )} />
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 border border-white/10">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Settings */}
      <div className={cn(
        "mt-auto pt-4 border-t border-white/5",
        !isExpanded && "flex justify-center"
      )}>
        <button
          onClick={onSettingsClick}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 group",
            !isExpanded && "justify-center px-2"
          )}
        >
          <span className="transition-transform duration-200 group-hover:rotate-45">
            {isExpanded ? '⚙️' : <Settings size={20} />}
          </span>
          
          {isExpanded && (
            <span className="font-medium text-sm whitespace-nowrap text-zinc-400">
              Settings
            </span>
          )}

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 border border-white/10">
              Settings
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
