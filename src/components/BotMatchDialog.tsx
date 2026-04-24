import React, { useState } from 'react';
import { useEngineStore } from '@/store/engineStore';
import { useGameStore } from '@/store/gameStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { X, Zap, Clock, Swords } from 'lucide-react';
import { BOTS } from '@/lib/bots';

interface BotMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartMatch: (bot: any) => void;
}

export const BotMatchDialog: React.FC<BotMatchDialogProps> = ({ 
  open, 
  onOpenChange,
  onStartMatch
}) => {
  const { resetGame, resetTimers } = useGameStore();
  const { setEngineSettings } = useEngineStore();
  
  const [selectedBot, setSelectedBot] = useState(BOTS[2]);
  const [minutes, setMinutes] = useState(10);
  const [increment, setIncrement] = useState(0);

  const handleStartGame = () => {
    // Set engine skill level based on bot ELO
    const skillLevel = Math.min(20, Math.max(0, Math.floor((selectedBot.elo / 3200) * 20)));
    setEngineSettings({ skillLevel });
    
    // Reset game with new time control
    resetGame();
    resetTimers();
    
    onStartMatch(selectedBot);
  };

  const getTimeDisplay = (minutes: number, increment: number) => {
    if (increment > 0) {
      return `${minutes} + ${increment}`;
    }
    return `${minutes} min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 rounded-2xl border-2 border-zinc-800 bg-zinc-950 shadow-[0_8px_0_0_#09090b] overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b-2 border-2 border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Swords className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">Challenge Bot</DialogTitle>
                <DialogDescription className="text-zinc-500 font-medium text-sm mt-0.5">
                  Select your opponent and match conditions
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="rounded-lg h-8 w-8 hover:bg-zinc-800 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-zinc-400" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Bot Selection */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              Opponent Profile
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {BOTS.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => setSelectedBot(bot)}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all duration-200 text-center relative",
                    selectedBot.id === bot.id
                      ? "bg-zinc-900 border-primary"
                      : "bg-zinc-950 border-2 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                  )}
                >
                  <img src={bot.avatar} alt={bot.name} className="w-10 h-10 mx-auto mb-2 rounded-full border-2 border-zinc-700" />
                  <div className="text-xs font-bold text-white mb-0.5 uppercase tracking-tight">{bot.name}</div>
                  <div className="text-[10px] font-bold text-zinc-400">{bot.elo} ELO</div>
                </button>
              ))}
            </div>

            {/* Selected Bot Info Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border-2 border-zinc-800">
              <div className="flex items-start gap-4">
                <img src={selectedBot.avatar} alt={selectedBot.name} className="w-14 h-14 rounded-full border-2 border-zinc-700 bg-zinc-800" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white text-base">{selectedBot.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold uppercase tracking-widest">
                      {selectedBot.elo} ELO
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">{selectedBot.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Control */}
          <div className="space-y-4 pt-2 border-t-2 border-2 border-zinc-800">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} />
              Time Control
            </h3>

            {/* Minutes Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">Minutes per side</label>
                <span className="text-sm font-bold text-primary">{minutes}</span>
              </div>
              <Slider
                value={[minutes]}
                onValueChange={(v) => setMinutes(v[0])}
                min={1}
                max={60}
                step={1}
              />
              <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                <span>Bullet (1m)</span>
                <span>Blitz (3-5m)</span>
                <span>Rapid (10m)</span>
                <span>Classical (60m)</span>
              </div>
            </div>

            {/* Increment Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">Increment (seconds)</label>
                <span className="text-sm font-bold text-primary">+{increment}</span>
              </div>
              <Slider
                value={[increment]}
                onValueChange={(v) => setIncrement(v[0])}
                min={0}
                max={30}
                step={1}
              />
            </div>

            {/* Time Display */}
            <div className="p-3 rounded-xl bg-zinc-900 border-2 border-zinc-800 text-center mt-4">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Selected Time Control</span>
              <div className="text-xl font-bold text-white mt-0.5">
                {getTimeDisplay(minutes, increment)}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Button 
            onClick={handleStartGame}
            className="w-full h-12 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-white"
          >
            <Swords className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
