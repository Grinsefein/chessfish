import React, { useState } from 'react';
import { useEngineStore, ENGINE_VERSIONS, BOARD_THEMES, type BoardTheme, type Language, type ReportMode } from '@/store/engineStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Palette,
  Gamepad2,
  Cpu,
  Microscope,
  Shield,
  Key,
  Eye,
  Volume2,
  Check,
  Globe,
  User,
  Moon,
  Zap,
  Clock,
  Target,
  AlertTriangle,
  Crosshair,
  Swords,
  Crown,
  ArrowRightLeft,
  Grid3X3,
  Type,
  Paintbrush,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'board', label: 'Board & General', icon: Palette },
  { id: 'game', label: 'Play Mode', icon: Gamepad2 },
  { id: 'engine', label: 'Engine', icon: Cpu },
  { id: 'analysis', label: 'Analysis', icon: Microscope },
  { id: 'threats', label: 'Threats', icon: Shield },
  { id: 'elements', label: 'Key Elements', icon: Key },
  { id: 'visuals', label: 'Visuals', icon: Eye },
  { id: 'audio', label: 'Audio', icon: Volume2 },
];

const LANGUAGES: { id: Language; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('board');
  const engineStore = useEngineStore();
  
  // Destructure all settings from store
  const {
    // Engine settings
    status,
    selectedEngine,
    selectedEngineVersion,
    cloudRuntime,
    threads,
    hashSize,
    energySavingMode,
    isRefreshingSnapshot,
    analysisMode,
    maxDepth,
    maxTimePerMove,
    multiPv,
    commandLogs,
    setEngineSettings,
    setEnergySavingMode,
    setAnalysisMode,
    setMaxDepth,
    setMaxTimePerMove,
    setEngineVersion,
    clearLogs,
    bootEngine,
    shutdownEngine,
    // Board & General
    boardTheme,
    language,
    username,
    setBoardTheme,
    setLanguage,
    setUsername,
    // Game Settings
    zenMode,
    premoveEnabled,
    showThreatsInPlay,
    showEvalBar,
    pauseOnBlunder,
    pauseOnMistake,
    showMoveStrength,
    showOpponentMoveStrength,
    setZenMode,
    setPremoveEnabled,
    setShowThreatsInPlay,
    setShowEvalBar,
    setPauseOnBlunder,
    setPauseOnMistake,
    setShowMoveStrength,
    setShowOpponentMoveStrength,
    // Threat Settings
    showThreatsInAnalysis,
    showMateThreat,
    showTacticalThreat,
    showAttackingMoves,
    showStronglyDefended,
    showWeaklyDefended,
    showPawnWeaknesses,
    arrowColor,
    showThreatArrows,
    markThreatenedSquares,
    setShowThreatsInAnalysis,
    setShowMateThreat,
    setShowTacticalThreat,
    setShowAttackingMoves,
    setShowStronglyDefended,
    setShowWeaklyDefended,
    setShowPawnWeaknesses,
    setArrowColor,
    setShowThreatArrows,
    setMarkThreatenedSquares,
    // Key Elements
    showKeyElementsInPlay,
    showKeyElementsInAnalysis,
    showPinnedPieces,
    showKingInCheck,
    showUndefendedPieces,
    showPieceMobility,
    showBackwardPawns,
    showIsolatedPawns,
    showPassedPawns,
    setShowKeyElementsInPlay,
    setShowKeyElementsInAnalysis,
    setShowPinnedPieces,
    setShowKingInCheck,
    setShowUndefendedPieces,
    setShowPieceMobility,
    setShowBackwardPawns,
    setShowIsolatedPawns,
    setShowPassedPawns,
    // Analysis Reports
    quickReportMode,
    quickReportValue,
    deepReportMode,
    deepReportValue,
    intelligentAnalysis,
    showCPL,
    setQuickReportMode,
    setQuickReportValue,
    setDeepReportMode,
    setDeepReportValue,
    setIntelligentAnalysis,
    setShowCPL,
    // Visuals
    animationSpeed,
    enlargePieceOnDrag,
    drawArrows,
    arrowColorsByStrength,
    figurineNotation,
    manualArrowsEnabled,
    showPreviousBestMove,
    colorLastMoveByStrength,
    verticalMovesOnMobile,
    showLegalDots,
    autoFlipBoard,
    pieceStyle,
    setAnimationSpeed,
    setEnlargePieceOnDrag,
    setDrawArrows,
    setArrowColorsByStrength,
    setFigurineNotation,
    setManualArrowsEnabled,
    setShowPreviousBestMove,
    setColorLastMoveByStrength,
    setVerticalMovesOnMobile,
    setShowLegalDots,
    setAutoFlipBoard,
    setPieceStyle,
    // Audio
    soundEnabled,
    moveSoundEnabled,
    checkAlarmEnabled,
    uiSoundsEnabled,
    setSoundEnabled,
    setMoveSoundEnabled,
    setCheckAlarmEnabled,
    setUiSoundsEnabled,
  } = engineStore;

  const effectiveVersion = selectedEngine === 'cloud' ? cloudRuntime.engineVersion : selectedEngineVersion;

  const renderSectionTitle = (title: string) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{title}</Label>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
    </div>
  );

  const renderToggle = (
    label: string,
    description: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ) => (
    <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-between group hover:bg-zinc-900 transition-colors">
      <div className="min-w-0 pr-3">
        <div className="text-xs font-bold text-white uppercase tracking-wide">{label}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90 shrink-0" />
    </div>
  );

  // Board preview component
  const BoardPreview = ({ theme }: { theme: BoardTheme }) => {
    const t = BOARD_THEMES[theme];
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        squares.push(
          <div
            key={`${row}-${col}`}
            className="w-full h-full"
            style={{ backgroundColor: isLight ? t.light : t.dark }}
          />
        );
      }
    }
    return (
      <div className="relative">
        <div className="grid grid-cols-8 w-32 h-32 rounded-lg overflow-hidden border-2 border-zinc-700 shadow-lg">
          {squares}
        </div>
        {/* Sample pieces */}
        <div className="absolute top-1 left-1 text-lg">♜</div>
        <div className="absolute top-1 right-1 text-lg">♖</div>
        <div className="absolute bottom-1 left-1 text-lg">♟</div>
        <div className="absolute bottom-1 right-1 text-lg">♙</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">👑</div>
      </div>
    );
  };

  const renderBoardTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderSectionTitle('Preview')}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-center gap-6">
        <BoardPreview theme={boardTheme} />
        <div className="text-center">
          <div className="text-3xl mb-1">{BOARD_THEMES[boardTheme].icon}</div>
          <div className="text-sm font-bold text-white">{BOARD_THEMES[boardTheme].name}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Current Theme</div>
        </div>
      </div>

      {renderSectionTitle('Classic Themes')}
      <div className="grid grid-cols-5 gap-2">
        {(['green', 'blue', 'brown', 'purple', 'black'] as BoardTheme[]).map((theme) => (
          <button
            key={theme}
            onClick={() => setBoardTheme(theme)}
            className={cn(
              "p-2 rounded-xl border-2 transition-all text-center",
              boardTheme === theme
                ? 'border-primary bg-primary/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            )}
          >
            <div className="text-lg mb-1">{BOARD_THEMES[theme].icon}</div>
            <div className="flex gap-0.5 justify-center mb-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: BOARD_THEMES[theme].light }} />
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: BOARD_THEMES[theme].dark }} />
            </div>
            <div className="text-[9px] font-bold text-white leading-tight">{BOARD_THEMES[theme].name}</div>
          </button>
        ))}
      </div>

      {renderSectionTitle('Fun Themes')}
      <div className="grid grid-cols-4 gap-2">
        {(['beach', 'winter', 'clash', 'mario', 'forest', 'cherry', 'ocean', 'sunset'] as BoardTheme[]).map((theme) => (
          <button
            key={theme}
            onClick={() => setBoardTheme(theme)}
            className={cn(
              "p-2 rounded-xl border-2 transition-all text-center",
              boardTheme === theme
                ? 'border-primary bg-primary/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            )}
          >
            <div className="text-xl mb-1">{BOARD_THEMES[theme].icon}</div>
            <div className="flex gap-0.5 justify-center mb-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: BOARD_THEMES[theme].light }} />
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: BOARD_THEMES[theme].dark }} />
            </div>
            <div className="text-[9px] font-bold text-white leading-tight">{BOARD_THEMES[theme].name}</div>
          </button>
        ))}
      </div>

      {renderSectionTitle('Language')}
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={cn(
              "flex-1 p-2 rounded-xl border-2 transition-all text-center",
              language === lang.id
                ? 'border-primary bg-primary/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="text-[10px] font-bold text-white mt-0.5">{lang.label}</div>
          </button>
        ))}
      </div>

      {renderSectionTitle('User Profile')}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
        <div className="flex items-center gap-2">
          <User size={14} className="text-primary" />
          <Label className="text-xs font-bold text-white uppercase">Username</Label>
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="chess.com/lichess username"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-[10px] text-zinc-500 leading-tight">
          Board auto-flips during analysis if username matches.
        </p>
      </div>
    </div>
  );

  const renderGameTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderSectionTitle('Focus & Flow')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Zen Mode', 'Hide UI during play', zenMode, setZenMode)}
        {renderToggle('Premove', 'Move while engine thinks', premoveEnabled, setPremoveEnabled)}
      </div>

      {renderSectionTitle('Display')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Eval Bar', 'Show evaluation bar', showEvalBar, setShowEvalBar)}
        {renderToggle('Threats', 'Show threat warnings', showThreatsInPlay, setShowThreatsInPlay)}
        {renderToggle('Your Strength', 'Show move badges', showMoveStrength, setShowMoveStrength)}
        {renderToggle('Opponent Strength', 'Show opponent badges', showOpponentMoveStrength, setShowOpponentMoveStrength)}
      </div>

      {renderSectionTitle('Pause on Mistakes')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('On Blunder (??)', 'Stop clock on blunders', pauseOnBlunder, setPauseOnBlunder)}
        {renderToggle('On Mistake (?)', 'Stop clock on mistakes', pauseOnMistake, setPauseOnMistake)}
      </div>
    </div>
  );

  const renderEngineTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderSectionTitle('Status')}
      <div className={cn(
        "p-3 rounded-xl border flex items-center justify-between gap-4",
        status === 'ready' ? 'border-green-500/30 bg-green-500/5' :
        status === 'booting' ? 'border-amber-500/30 bg-amber-500/5' :
        status === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-800 bg-zinc-900/50'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full shrink-0",
            status === 'ready' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'booting' ? 'bg-amber-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-zinc-600'
          )} />
          <div>
            <div className="text-sm font-bold text-white uppercase">
              {status === 'ready' ? 'Active' : status === 'booting' ? 'Booting...' : status === 'error' ? 'Error' : 'Offline'}
            </div>
            <div className="text-[10px] text-zinc-500">
              {cloudRuntime.engineVersion}
            </div>
          </div>
        </div>
        
        {status === 'offline' || status === 'error' ? (
          <Button onClick={() => bootEngine()} size="sm" className="bg-green-600 hover:bg-green-500 text-white font-black px-4 rounded-lg h-8 text-xs">
            <Zap className="w-3 h-3 mr-1" /> Start
          </Button>
        ) : (
          <Button onClick={() => shutdownEngine()} size="sm" variant="outline" className="border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 font-black px-4 rounded-lg h-8 text-xs">
            Stop
          </Button>
        )}
      </div>

      {renderSectionTitle('Version')}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {ENGINE_VERSIONS.map((version) => (
          <button
            key={version.id}
            onClick={() => setEngineVersion(version.id)}
            className={cn(
              "group p-2.5 rounded-xl border transition-all text-left",
              effectiveVersion === version.id
                ? 'border-primary/50 bg-primary/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            )}
          >
            <div className={cn("text-xs font-bold uppercase", effectiveVersion === version.id ? 'text-primary' : 'text-white')}>{version.label}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{version.description}</div>
          </button>
        ))}
      </div>

      {renderSectionTitle('Hardware')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-zinc-400 uppercase">Threads</Label>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{threads}</span>
          </div>
          <Slider value={[threads]} onValueChange={(v) => setEngineSettings({ threads: v[0] })} min={1} max={8} step={1} className="py-1" />
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-zinc-400 uppercase">Hash</Label>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{hashSize}MB</span>
          </div>
          <Slider value={[hashSize]} onValueChange={(v) => setEngineSettings({ hashSize: v[0] })} min={16} max={1024} step={16} className="py-1" />
        </div>
      </div>

      {renderToggle('Energy Saving', 'Reduce CPU when idle', energySavingMode, setEnergySavingMode)}

      {renderSectionTitle('Multi-PV')}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-zinc-400 uppercase">Analysis Lines</Label>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{multiPv}</span>
        </div>
        <Slider value={[multiPv]} onValueChange={(v) => setEngineSettings({ multiPv: v[0] })} min={1} max={5} step={1} className="py-1" />
      </div>

      {renderSectionTitle('Engine Logs')}
      <div className="rounded-xl bg-zinc-900/50 border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <Label className="text-[10px] font-bold text-zinc-400 uppercase">Command Output</Label>
          {commandLogs.length > 0 && (
            <button
              onClick={() => void clearLogs()}
              className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-wider transition-colors bg-zinc-950 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>
        <div className="h-32 overflow-y-auto custom-scrollbar font-mono text-[10px] p-3">
          {commandLogs.length === 0 ? (
            <div className="text-zinc-600 italic text-center py-8 text-xs">
              No engine output yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {commandLogs.slice(-50).map((log, index) => (
                <div key={index} className="text-zinc-400 break-all hover:text-white transition-colors">
                  <span className="text-zinc-700 mr-2 select-none">{String(index + 1).padStart(3, '0')}</span>{log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderToggle('Intelligent Analysis', 'Auto-adjust depth by position complexity', intelligentAnalysis, setIntelligentAnalysis)}

      {!intelligentAnalysis && (
        <>
          {renderSectionTitle('Quick Report')}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
            <div className="flex gap-1 p-0.5 bg-zinc-950 rounded-lg">
              <button onClick={() => setQuickReportMode('depth')} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", quickReportMode === 'depth' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>Depth</button>
              <button onClick={() => setQuickReportMode('time')} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", quickReportMode === 'time' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>Time</button>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-zinc-400 uppercase">{quickReportMode === 'depth' ? 'Max Depth' : 'Max Sec'}</Label>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{quickReportValue}</span>
            </div>
            <Slider value={[quickReportValue]} onValueChange={(v) => setQuickReportValue(v[0])} min={quickReportMode === 'depth' ? 10 : 1} max={quickReportMode === 'depth' ? 25 : 30} step={1} className="py-1" />
          </div>

          {renderSectionTitle('Deep Report')}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
            <div className="flex gap-1 p-0.5 bg-zinc-950 rounded-lg">
              <button onClick={() => setDeepReportMode('depth')} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", deepReportMode === 'depth' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>Depth</button>
              <button onClick={() => setDeepReportMode('time')} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", deepReportMode === 'time' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>Time</button>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-zinc-400 uppercase">{deepReportMode === 'depth' ? 'Max Depth' : 'Max Sec'}</Label>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{deepReportValue}</span>
            </div>
            <Slider value={[deepReportValue]} onValueChange={(v) => setDeepReportValue(v[0])} min={deepReportMode === 'depth' ? 15 : 5} max={deepReportMode === 'depth' ? 35 : 60} step={deepReportMode === 'depth' ? 1 : 5} className="py-1" />
          </div>
        </>
      )}

      {renderToggle('Show CPL', 'Display centipawn loss in reports', showCPL, setShowCPL)}
    </div>
  );

  const renderThreatsTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderSectionTitle('Global')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('In Play', 'Show threats while playing', showThreatsInPlay, setShowThreatsInPlay)}
        {renderToggle('In Analysis', 'Show threats in analysis', showThreatsInAnalysis, setShowThreatsInAnalysis)}
        {renderToggle('Arrows', 'Draw threat arrows', showThreatArrows, setShowThreatArrows)}
        {renderToggle('Mark Squares', 'Highlight threatened squares', markThreatenedSquares, setMarkThreatenedSquares)}
      </div>

      {renderSectionTitle('Types')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Mate', 'Checkmate threats', showMateThreat, setShowMateThreat)}
        {renderToggle('Tactical', 'Best move threats', showTacticalThreat, setShowTacticalThreat)}
        {renderToggle('Attacking', 'Discovered attacks', showAttackingMoves, setShowAttackingMoves)}
        {renderToggle('Strong Defended', 'Green highlight', showStronglyDefended, setShowStronglyDefended)}
        {renderToggle('Weak Defended', 'Yellow highlight', showWeaklyDefended, setShowWeaklyDefended)}
        {renderToggle('Pawn Weakness', 'Red highlight', showPawnWeaknesses, setShowPawnWeaknesses)}
      </div>

      {renderSectionTitle('Arrow Color')}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
        <Label className="text-xs font-bold text-zinc-400 uppercase">Custom Color</Label>
        <div className="flex items-center gap-2">
          <input type="color" value={arrowColor} onChange={(e) => setArrowColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
          <span className="text-xs font-mono text-zinc-500">{arrowColor}</span>
        </div>
      </div>
    </div>
  );

  const renderElementsTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderSectionTitle('Global')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('In Play', 'Show while playing', showKeyElementsInPlay, setShowKeyElementsInPlay)}
        {renderToggle('In Analysis', 'Show in analysis', showKeyElementsInAnalysis, setShowKeyElementsInAnalysis)}
      </div>

      {renderSectionTitle('Types')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Pinned', 'Pin indicator', showPinnedPieces, setShowPinnedPieces)}
        {renderToggle('Check', '+ on king', showKingInCheck, setShowKingInCheck)}
        {renderToggle('Undefended', 'Broken shield', showUndefendedPieces, setShowUndefendedPieces)}
        {renderToggle('Mobility', 'Percentage', showPieceMobility, setShowPieceMobility)}
        {renderToggle('Backward', 'Red dot', showBackwardPawns, setShowBackwardPawns)}
        {renderToggle('Isolated', 'Orange dot', showIsolatedPawns, setShowIsolatedPawns)}
        {renderToggle('Passed', 'Green dot', showPassedPawns, setShowPassedPawns)}
      </div>
    </div>
  );

  const renderVisualsTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderSectionTitle('Animation')}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-2">
        <Label className="text-[10px] font-bold text-zinc-400 uppercase">Speed</Label>
        <div className="flex gap-1 p-0.5 bg-zinc-950 rounded-lg">
          {(['slow', 'default', 'fast'] as const).map((speed) => (
            <button key={speed} onClick={() => setAnimationSpeed(speed)} className={cn("flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all", animationSpeed === speed ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>{speed}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Enlarge on Drag', 'Bigger pieces when dragging', enlargePieceOnDrag, setEnlargePieceOnDrag)}
        {renderToggle('Legal Dots', 'Show possible moves', showLegalDots, setShowLegalDots)}
      </div>

      {renderSectionTitle('Arrows')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Engine Arrows', 'Show best moves', drawArrows, setDrawArrows)}
        {renderToggle('Color by Strength', 'Green/red arrows', arrowColorsByStrength, setArrowColorsByStrength)}
        {renderToggle('Manual Arrows', 'Draw on board', manualArrowsEnabled, setManualArrowsEnabled)}
        {renderToggle('Previous Best', 'Ghost arrow', showPreviousBestMove, setShowPreviousBestMove)}
        {renderToggle('Color Last Move', 'By classification', colorLastMoveByStrength, setColorLastMoveByStrength)}
      </div>

      {renderSectionTitle('Notation')}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderToggle('Figurine', 'Use ♔ instead of K', figurineNotation, setFigurineNotation)}
        {renderToggle('Vertical Mobile', 'Stack moves', verticalMovesOnMobile, setVerticalMovesOnMobile)}
        {renderToggle('Auto-Flip', 'By username', autoFlipBoard, setAutoFlipBoard)}
      </div>

      {renderSectionTitle('Piece Style')}
      <div className="flex gap-2">
        {(['standard', 'neo', 'classic'] as const).map((style) => (
          <button key={style} onClick={() => setPieceStyle(style)} className={cn("flex-1 p-2 rounded-xl border-2 transition-all text-center", pieceStyle === style ? 'border-primary bg-primary/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700')}>
            <div className="text-xl mb-1">♟</div>
            <div className="text-[10px] font-bold text-white capitalize">{style}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-primary/30 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white uppercase">Master Sound</div>
          <div className="text-[10px] text-zinc-500">Enable all audio</div>
        </div>
        <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
      </div>

      {soundEnabled && (
        <>
          {renderSectionTitle('Effects')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {renderToggle('Move', 'Piece sounds', moveSoundEnabled, setMoveSoundEnabled)}
            {renderToggle('Check', 'Warning alarm', checkAlarmEnabled, setCheckAlarmEnabled)}
            {renderToggle('UI', 'Button clicks', uiSoundsEnabled, setUiSoundsEnabled)}
          </div>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'board': return renderBoardTab();
      case 'game': return renderGameTab();
      case 'engine': return renderEngineTab();
      case 'analysis': return renderAnalysisTab();
      case 'threats': return renderThreatsTab();
      case 'elements': return renderElementsTab();
      case 'visuals': return renderVisualsTab();
      case 'audio': return renderAudioTab();
      default: return renderBoardTab();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-16 lg:pb-0">
      {/* Header */}
      <header className="h-14 lg:h-16 border-b border-white/5 bg-zinc-950 flex items-center px-4 lg:px-8 shrink-0 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mr-4 lg:mr-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-black uppercase tracking-wider hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-3 lg:gap-5">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_0_0_#4a6728]">
            <Palette className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase">Settings</h1>
            <p className="text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:block">
              Master Configuration Panel
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full relative z-0">
        {/* Sidebar Navigation - Desktop */}
        <div className="hidden lg:flex w-64 border-r border-white/5 bg-zinc-950 flex-col shrink-0">
          <div className="flex-1 p-3 space-y-1 overflow-y-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border",
                  activeTab === tab.id
                    ? "bg-zinc-800 border-white/10 text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  activeTab === tab.id ? "bg-white/10 text-primary" : "bg-zinc-900 text-zinc-500"
                )}>
                  <tab.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black uppercase tracking-wide">{tab.label}</div>
                </div>
                {activeTab === tab.id && <ChevronRight size={14} className="text-zinc-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 relative">
          {/* Mobile Tabs */}
          <div className="lg:hidden w-full border-b border-white/5 bg-zinc-950 p-2 shrink-0 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border whitespace-nowrap",
                    activeTab === tab.id ? "bg-zinc-800 text-white border-white/10" : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 lg:p-6 custom-scrollbar relative">
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="max-w-[900px] mx-auto relative z-10">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
