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
    <div className="flex h-screen bg-zinc-950 overflow-hidden font-sans">
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
          "w-96 bg-zinc-900 rounded-2xl shadow-[0_8px_0_0_#09090b] my-4 mr-4",
          "border-2 border-zinc-800 overflow-hidden flex flex-col"
        )}>
          {rightPanel}
        </aside>
      </main>
    </div>
  );
};

export default AppLayout;
