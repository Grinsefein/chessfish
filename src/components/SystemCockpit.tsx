import React, { useState } from 'react';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { 
  Settings2, 
  Palette
} from 'lucide-react';

interface SystemCockpitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemCockpit: React.FC<SystemCockpitProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Sheet open={open} onOpenChange={onOpenChange} className="w-[600px]">
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle>System Cockpit</SheetTitle>
              <SheetDescription>System & appearance configuration</SheetDescription>
            </div>
          </div>
          <SheetClose onClick={() => onOpenChange(false)} />
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-40 border-r border-white/[0.06] bg-zinc-950/30 p-2 shrink-0">
            <TabsList className="flex flex-col h-auto bg-transparent gap-1">
              <TabsTrigger
                value="general"
                className="justify-start gap-2 px-3 py-2 h-auto data-[state=active]:bg-zinc-800 rounded-lg text-zinc-500 data-[state=active]:text-zinc-100 text-sm"
              >
                <Settings2 size={16} />
                <span className="font-medium">General</span>
              </TabsTrigger>
              <TabsTrigger
                value="board"
                className="justify-start gap-2 px-3 py-2 h-auto data-[state=active]:bg-zinc-800 rounded-lg text-zinc-500 data-[state=active]:text-zinc-100 text-sm"
              >
                <Palette size={16} />
                <span className="font-medium">Board</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* General Tab */}
            <TabsContent value="general" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Game Settings</h3>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-zinc-300">Sound Effects</Label>
                      <p className="text-xs text-zinc-500">Play move and capture sounds</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-zinc-300">Move Confirmation</Label>
                      <p className="text-xs text-zinc-500">Require confirmation for moves</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-zinc-300">Auto-Queen Promotion</Label>
                      <p className="text-xs text-zinc-500">Automatically promote to queen</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Session</h3>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/[0.06] space-y-3">
                  <p className="text-xs text-zinc-500">
                    Game state is automatically saved to localStorage. Your position will persist across page refreshes.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/[0.06] bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                    onClick={() => {
                      localStorage.removeItem('chessfish-game-storage');
                      window.location.reload();
                    }}
                  >
                    Clear Saved Game & Reset
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Board Tab */}
            <TabsContent value="board" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Board Theme</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Classic Green', light: '#ebecd0', dark: '#739552' },
                    { name: 'Modern Blue', light: '#eae9d2', dark: '#4b7399' },
                    { name: 'Wood', light: '#f0d9b5', dark: '#b58863' },
                    { name: 'Midnight', light: '#4a4a4a', dark: '#2e2e2e' },
                  ].map(theme => (
                    <button
                      key={theme.name}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-white/[0.06] hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md overflow-hidden flex flex-wrap border border-white/[0.06]">
                        <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.light }} />
                        <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.dark }} />
                        <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.dark }} />
                        <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.light }} />
                      </div>
                      <span className="text-sm font-medium text-zinc-300">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Piece Set</h3>
                
                <div className="grid grid-cols-4 gap-3">
                  {['cburnett', 'merida', 'alpha', 'chessnut'].map(set => (
                    <button
                      key={set}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800/50 border border-white/[0.06] hover:bg-zinc-800 transition-colors"
                    >
                      <img 
                        src={`https://chessboardjs.com/img/chesspieces/${set}/wN.png`}
                        alt={set}
                        className="w-8 h-8"
                      />
                      <span className="text-xs font-medium text-zinc-400 capitalize">{set}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
