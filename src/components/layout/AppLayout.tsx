import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
  onSettingsClick: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  rightPanel,
  onSettingsClick 
}) => {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar onSettingsClick={onSettingsClick} />

      {/* Main Content Area */}
      <main className="flex-1 flex min-w-0">
        {/* Center: Chessboard + Analysis Bar */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-w-0">
          <div className="w-full max-w-[700px] flex flex-col items-center">
            {children}
          </div>
        </div>

        {/* Right Panel */}
        <aside className={cn(
          "w-96 bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-xl my-4 mr-4",
          "border border-white/5 overflow-hidden flex flex-col"
        )}>
          {rightPanel}
        </aside>
      </main>
    </div>
  );
};

export default AppLayout;
