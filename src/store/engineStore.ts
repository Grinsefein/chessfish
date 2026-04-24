import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';

export type EngineType = 'local-wasm' | 'local-legacy' | 'cloud';
export type EngineStatus = 'offline' | 'booting' | 'ready' | 'error';
export type EngineVersion = 'stockfish-13' | 'stockfish-14' | 'stockfish-16' | 'stockfish-18' | 'lc0';
export type AnalysisMode = 'depth' | 'time';
export type AnimationSpeed = 'slow' | 'default' | 'fast';
export type ActiveView = 'play' | 'analyze' | 'import' | 'upload' | 'explorer';

interface EngineConfig {
  id: EngineType;
  name: string;
  description: string;
  url?: string;
  isCloud: boolean;
}

export const ENGINES: EngineConfig[] = [
  {
    id: 'cloud',
    name: 'Stockfish 16.1 (Pro Cloud)',
    description: 'High-performance server-side engine for maximum accuracy',
    isCloud: true,
  },
  {
    id: 'local-wasm',
    name: 'Stockfish 16.1 (Local)',
    description: 'Runs in your browser using WASM technology',
    url: '/stockfish.js',
    isCloud: false,
  },
  {
    id: 'local-legacy',
    name: 'Stockfish 10 (Legacy)',
    description: 'Lightweight local engine for older devices',
    url: 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js',
    isCloud: false,
  },
];

interface EngineState {
  // Selected engine
  selectedEngine: EngineType;
  
  // Engine status
  status: EngineStatus;
  statusMessage: string;
  
  // Connection
  worker: Worker | null;
  socket: Socket | null;
  
  // Command logs
  commandLogs: string[];
  
  // Analysis results
  isAnalyzing: boolean;
  currentEvaluation: number;
  bestMove: string | null;
  depth: number;
  nps: number;
  nodes: number;
  time: number;
  lines: Array<{
    evaluation: number;
    isMate: boolean;
    bestMove: string;
    pv: string;
    depth: number;
  }>;
  
  // Engine settings
  multiPv: number;
  skillLevel: number;
  hashSize: number;
  threads: number;
  useNNUE: boolean;
  
  // Engine Version Selection
  selectedEngineVersion: EngineVersion;
  energySavingMode: boolean;
  
  // Analysis Limits
  analysisMode: AnalysisMode;
  maxDepth: number;
  maxTimePerMove: number;
  
  // Visuals & Board
  enlargePieceOnDrag: boolean;
  animationSpeed: AnimationSpeed;
  drawArrows: boolean;
  arrowColorsByStrength: boolean;
  
  // Notation & UX
  figurineNotation: boolean;
  soundEnabled: boolean;
  
  // Key Elements (Schlüsselelemente)
  showPinnedPieces: boolean;
  showKingInCheck: boolean;
  showUndefendedPieces: boolean;
  showPieceMobility: boolean;
  showIsolatedPawns: boolean;
  showPassedPawns: boolean;
  
  // Navigation
  activeView: ActiveView;
  
  // Actions
  selectEngine: (engine: EngineType) => void;
  setStatus: (status: EngineStatus, message?: string) => void;
  setWorker: (worker: Worker | null) => void;
  setSocket: (socket: any | null) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  
  // Engine Lifecycle
  bootEngine: () => Promise<void>;
  shutdownEngine: () => void;
  sendCommand: (command: string) => void;
  
  startAnalysis: () => void;
  stopAnalysis: () => void;
  analyze: (fen: string) => void;
  setAnalysisResult: (result: {
    evaluation: number;
    bestMove: string;
    depth: number;
    lines: EngineState['lines'];
  }) => void;
  updateLine: (index: number, line: EngineState['lines'][0]) => void;
  setBestMove: (bestMove: string) => void;
  setEngineSettings: (settings: Partial<Pick<EngineState, 'multiPv' | 'skillLevel' | 'hashSize' | 'threads' | 'useNNUE'>>) => void;
  resetAnalysis: () => void;
  terminate: () => void;
  
  // UI Settings Actions
  setEngineVersion: (version: EngineVersion) => void;
  setEnergySavingMode: (enabled: boolean) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setMaxDepth: (depth: number) => void;
  setMaxTimePerMove: (seconds: number) => void;
  setEnlargePieceOnDrag: (enabled: boolean) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setDrawArrows: (enabled: boolean) => void;
  setArrowColorsByStrength: (enabled: boolean) => void;
  setFigurineNotation: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Key Elements Actions
  setShowPinnedPieces: (enabled: boolean) => void;
  setShowKingInCheck: (enabled: boolean) => void;
  setShowUndefendedPieces: (enabled: boolean) => void;
  setShowPieceMobility: (enabled: boolean) => void;
  setShowIsolatedPawns: (enabled: boolean) => void;
  setShowPassedPawns: (enabled: boolean) => void;
  
  // Navigation Actions
  setActiveView: (view: ActiveView) => void;
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedEngine: 'cloud',
      status: 'offline',
      statusMessage: 'Engine not started',
      
      worker: null,
      socket: null,
      commandLogs: [],
      
      isAnalyzing: false,
      currentEvaluation: 0,
      bestMove: null,
      depth: 0,
      lines: [],
      
      multiPv: 3,
      skillLevel: 20,
      hashSize: 128,
      threads: 4,
      useNNUE: true,
      
      // Engine Version Selection
      selectedEngineVersion: 'stockfish-16',
      energySavingMode: false,
      
      // Analysis Limits
      analysisMode: 'depth',
      maxDepth: 20,
      maxTimePerMove: 5,
      
      // Visuals & Board
      enlargePieceOnDrag: true,
      animationSpeed: 'default',
      drawArrows: true,
      arrowColorsByStrength: true,
      
      // Notation & UX
      figurineNotation: false,
      soundEnabled: true,
      
      // Key Elements (Schlüsselelemente)
      showPinnedPieces: false,
      showKingInCheck: true,
      showUndefendedPieces: false,
      showPieceMobility: false,
      showIsolatedPawns: false,
      showPassedPawns: false,
      
      // Navigation
      activeView: 'play',
      
      // Select engine
      selectEngine: (engine) => {
        // Terminate current engine before switching
        get().terminate();
        set({ 
          selectedEngine: engine,
          status: 'offline',
          statusMessage: 'Engine switched.',
          worker: null,
          socket: null,
        });
        
        // Auto-boot if it's the cloud engine to sync state
        if (engine === 'cloud') {
          get().bootEngine();
        }
      },
      
      // Set status
      setStatus: (status, message) => set({ 
        status, 
        statusMessage: message || get().statusMessage 
      }),
      
      // Set worker
      setWorker: (worker) => set({ worker }),
      
      // Set socket
      setSocket: (socket) => set({ socket }),
      
      // Add log message
      addLog: (message) => set((state) => ({
        commandLogs: [...state.commandLogs, `[${new Date().toLocaleTimeString()}] ${message}`]
      })),
      
      // Clear logs
      clearLogs: () => set({ commandLogs: [] }),
      
      // Start analysis
      startAnalysis: () => {
        const { worker, status } = get();
        if (worker && status === 'ready') {
          worker.postMessage('go infinite');
          set({ isAnalyzing: true });
        }
      },
      
      // Stop analysis
      stopAnalysis: () => {
        const { worker, socket } = get();
        if (worker) {
          worker.postMessage('stop');
        }
        if (socket) {
          socket.emit('engine:stop');
        }
        set({ isAnalyzing: false });
      },

      // Trigger analysis for a given FEN
      analyze: (fen: string) => {
        const { worker, socket, status, analysisMode, maxDepth, maxTimePerMove, multiPv } = get();
        if (status !== 'ready') return;
        
        // Reset analysis state for new position
        set({ 
          isAnalyzing: true,
          lines: [],
          currentEvaluation: 0,
          bestMove: null,
          depth: 0,
          nps: 0,
          nodes: 0,
          time: 0,
        });

        if (worker) {
          worker.postMessage('stop');
          worker.postMessage('ucinewgame');
          worker.postMessage(`position fen ${fen}`);
          
          if (analysisMode === 'depth') {
            worker.postMessage(`go depth ${maxDepth}`);
          } else {
            worker.postMessage(`go movetime ${maxTimePerMove * 1000}`);
          }
        }

        if (socket) {
          socket.emit('engine:analyze', {
            fen,
            depth: maxDepth,
            multiPv,
            time: maxTimePerMove * 1000
          });
        }
      },
      
      // Set analysis results (bulk)
      setAnalysisResult: (result) => set({
        currentEvaluation: result.evaluation,
        bestMove: result.bestMove,
        depth: result.depth,
        lines: result.lines,
      }),

      // Update a single PV line by index (incremental streaming)
      updateLine: (index, line) => set((state) => {
        const lines = [...state.lines];
        while (lines.length <= index) {
          lines.push({ evaluation: 0, isMate: false, bestMove: '', pv: '', depth: 0 });
        }
        lines[index] = line;
        
        // Only update currentEvaluation if it's the primary line (index 0)
        // or if we don't have a primary line yet
        const currentEvaluation = index === 0 ? line.evaluation : state.currentEvaluation;
        const depth = index === 0 ? line.depth : state.depth;

        return {
          lines,
          currentEvaluation,
          depth: Math.max(state.depth, depth),
        };
      }),

      // Update best move after search completes
      setBestMove: (bestMove) => set((state) => ({
        bestMove,
        // Also update the first line if it's missing the best move
        lines: state.lines.map((l, i) => (i === 0 && !l.bestMove) ? { ...l, bestMove } : l),
      })),
      
      // Set engine settings
      setEngineSettings: (settings) => set((state) => {
        const { worker, socket, status } = state;
        if (status === 'ready') {
          if (worker) {
            if (settings.hashSize !== undefined) worker.postMessage(`setoption name Hash value ${settings.hashSize}`);
            if (settings.threads !== undefined) worker.postMessage(`setoption name Threads value ${settings.threads}`);
            if (settings.multiPv !== undefined) worker.postMessage(`setoption name MultiPV value ${settings.multiPv}`);
            if (settings.skillLevel !== undefined) worker.postMessage(`setoption name Skill Level value ${settings.skillLevel}`);
            if (settings.useNNUE !== undefined) worker.postMessage(`setoption name Use NNUE value ${settings.useNNUE}`);
            worker.postMessage('isready');
          }
          
          if (socket) {
            socket.emit('engine:update_config', { settings });
          }
        }
        return {
          ...state,
          ...settings,
        };
      }),
      
      // UI Settings Actions
      setEngineVersion: (version) => set({ selectedEngineVersion: version }),
      setEnergySavingMode: (enabled) => set({ energySavingMode: enabled }),
      setAnalysisMode: (mode) => set({ analysisMode: mode }),
      setMaxDepth: (depth) => set({ maxDepth: depth }),
      setMaxTimePerMove: (seconds) => set({ maxTimePerMove: seconds }),
      setEnlargePieceOnDrag: (enabled) => set({ enlargePieceOnDrag: enabled }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      setDrawArrows: (enabled) => set({ drawArrows: enabled }),
      setArrowColorsByStrength: (enabled) => set({ arrowColorsByStrength: enabled }),
      setFigurineNotation: (enabled) => set({ figurineNotation: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      
      // Key Elements Actions
      setShowPinnedPieces: (enabled) => set({ showPinnedPieces: enabled }),
      setShowKingInCheck: (enabled) => set({ showKingInCheck: enabled }),
      setShowUndefendedPieces: (enabled) => set({ showUndefendedPieces: enabled }),
      setShowPieceMobility: (enabled) => set({ showPieceMobility: enabled }),
      setShowIsolatedPawns: (enabled) => set({ showIsolatedPawns: enabled }),
      setShowPassedPawns: (enabled) => set({ showPassedPawns: enabled }),
      
      // Navigation Actions
      setActiveView: (view) => set({ activeView: view }),
      
      // Initialize engine store (check for existing backend connection or local resume)
      init: () => {
        const { selectedEngine, socket, worker, status } = get();
        
        // For cloud engine
        if (selectedEngine === 'cloud') {
          if (socket) {
            // Verify connection is alive and sync state/logs
            socket.emit('engine:status');
            socket.emit('engine:logs');
          } else {
            // No socket, need to connect
            get().bootEngine();
          }
          return;
        }

        // For local engines, resume if it was active
        if ((status === 'ready' || status === 'booting') && !socket && !worker) {
          get().bootEngine();
        }
      },
      
      // Engine Lifecycle - Boot (initialize the engine)
      bootEngine: async () => {
        const state = get();
        
        if (state.socket && state.selectedEngine === 'cloud') {
           // Already have a socket, just make sure it's activated
           state.socket.emit('engine:activate');
           return;
        }

        if (state.status === 'booting' || (state.status === 'ready' && state.selectedEngine !== 'cloud')) {
          console.log('Engine already booting or ready');
          return; // Already running
        }
        
        console.log('Booting engine:', state.selectedEngine);
        get().addLog(`Booting engine: ${state.selectedEngine}`);

        set({ 
          status: 'booting', 
          statusMessage: 'Initializing engine...',
          lines: [],
          currentEvaluation: 0,
          bestMove: null,
          depth: 0,
        });
        
        try {
          const engineConfig = ENGINES.find(e => e.id === state.selectedEngine);
          
          if (!engineConfig) {
            throw new Error('Engine configuration not found');
          }
          
          if (engineConfig.isCloud) {
            console.log('Connecting to cloud engine at http://localhost:4000');
            // Cloud engine - connect via socket to Node.js backend
            const socket = io('http://localhost:4000');
            
            socket.on('connect', () => {
              console.log('Cloud engine connected');
              // We don't mark as ready until we get engine:status
            });

            socket.on('engine:status', (status) => {
              if (status.active) {
                set({ 
                    status: status.ready ? 'ready' : 'booting', 
                    statusMessage: status.ready ? 'Backend engine ready' : 'Backend engine initializing...' 
                });
              } else {
                set({ status: 'offline', statusMessage: 'Backend engine offline' });
              }
            });

            socket.on('engine:logs', (logs: string[]) => {
               set({ commandLogs: logs });
            });

            socket.on('engine:log', (log: string) => {
               set((state) => ({ commandLogs: [...state.commandLogs, log] }));
            });

            socket.on('engine:info', (info) => {
              if (info.nps) set({ nps: info.nps });
              if (info.nodes) set({ nodes: info.nodes });
              if (info.time) set({ time: info.time });
              
              if (info.lines) {
                info.lines.forEach((line: any, idx: number) => {
                  get().updateLine(idx, {
                    evaluation: line.evaluation,
                    isMate: line.isMate || false,
                    bestMove: line.bestMove,
                    pv: line.pv,
                    depth: info.depth || line.depth,
                  });
                });
              }
            });

            socket.on('engine:result', (result) => {
              if (result.error) {
                console.error('Cloud analysis error:', result.error);
                return;
              }
              
              if (result.bestMove) {
                get().setBestMove(result.bestMove);
                set({ isAnalyzing: false });
              }

              if (result.lines && result.lines.length > 0) {
                result.lines.forEach((line: any, idx: number) => {
                  get().updateLine(idx, {
                    evaluation: line.evaluation,
                    isMate: line.isMate || false,
                    bestMove: line.bestMove,
                    pv: line.pv,
                    depth: result.depth || line.depth,
                  });
                });
              }
            });

            socket.on('disconnect', () => {
              console.log('Cloud engine disconnected');
              get().addLog('Cloud engine disconnected');
              set({ status: 'offline', statusMessage: 'Cloud disconnected', socket: null });
            });

            socket.on('connect_error', (err) => {
              console.error('Cloud connection error:', err);
              get().addLog(`Cloud connection error: ${err.message}`);
              set({ status: 'error', statusMessage: 'Backend connection failed', socket: null });
            });

            set({ socket });
            return;
          }
          
          // Local engine - create Web Worker
          let workerUrl = engineConfig.url || '/stockfish.js';
          
          // Fallback to single-threaded if SharedArrayBuffer is missing (e.g. missing COOP/COEP headers in cloud previews)
          if (engineConfig.id === 'local-wasm' && typeof SharedArrayBuffer === 'undefined') {
            console.warn('SharedArrayBuffer not defined, falling back to single-threaded Stockfish 16');
            workerUrl = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-single.js';
          }

          // Workaround for loading a Web Worker from a cross-origin URL
          if (workerUrl.startsWith('http')) {
            const blob = new Blob([`importScripts('${workerUrl}');`], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
          }

          console.log('Creating worker with URL:', workerUrl);
          const worker = new Worker(workerUrl, { type: 'classic' });
          
          // Set up message handler
          worker.onmessage = (e) => {
            const rawMessage = e.data;
            if (typeof rawMessage !== 'string') return;
            
            get().addLog(`Engine: ${rawMessage}`);

            // UCI messages can be multi-line
            const lines = rawMessage.split('\n');
            
            for (let message of lines) {
              message = message.trim();
              if (!message) continue;

              // Parse engine output
              if (message.includes('uciok')) {
                // UCI acknowledged, now configure options
                const current = get();
                worker.postMessage(`setoption name Hash value ${current.hashSize}`);
                worker.postMessage(`setoption name Threads value ${current.threads}`);
                worker.postMessage(`setoption name MultiPV value ${current.multiPv}`);
                worker.postMessage(`setoption name Skill Level value ${current.skillLevel}`);
                if (!current.useNNUE) {
                  worker.postMessage('setoption name Use NNUE value false');
                }
                worker.postMessage('isready');
              } 
              
              if (message.includes('readyok')) {
                // Engine is ready for commands
                set({ 
                  status: 'ready',
                  statusMessage: `${engineConfig.name} ready`,
                });
              } 
              
              if (message.startsWith('bestmove')) {
                const match = message.match(/bestmove\s+(\S+)/);
                if (match && match[1] !== '(none)') {
                  get().setBestMove(match[1]);
                } else {
                  get().setBestMove(null as any); // Type cast to allow null if needed, or handle (none)
                }
                set({ isAnalyzing: false });
              } 
              
              if (message.startsWith('info') && message.includes('depth')) {
                // Parse analysis info
                const depthMatch = message.match(/depth\s+(\d+)/);
                const cpMatch = message.match(/score\s+cp\s+(-?\d+)/);
                const mateMatch = message.match(/score\s+mate\s+(-?\d+)/);
                const multipvMatch = message.match(/multipv\s+(\d+)/);
                const pvMatch = message.match(/pv\s+(.+)/);
                const npsMatch = message.match(/nps\s+(\d+)/);
                const nodesMatch = message.match(/nodes\s+(\d+)/);
                const timeMatch = message.match(/time\s+(\d+)/);
                
                if (depthMatch) {
                  const depth = parseInt(depthMatch[1], 10);
                  const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
                  const nps = npsMatch ? parseInt(npsMatch[1], 10) : get().nps;
                  const nodes = nodesMatch ? parseInt(nodesMatch[1], 10) : get().nodes;
                  const time = timeMatch ? parseInt(timeMatch[1], 10) : get().time;

                  set({ nps, nodes, time });
                  
                  let eval_ = 0;
                  let isMate = false;
                  
                  if (cpMatch) {
                    eval_ = parseInt(cpMatch[1], 10) / 100;
                  } else if (mateMatch) {
                    eval_ = parseInt(mateMatch[1], 10);
                    isMate = true;
                  }
                  
                  const pv = pvMatch ? pvMatch[1] : '';
                  const bestMove = pv ? pv.split(' ')[0] : '';
                  
                  get().updateLine(multipv - 1, {
                    evaluation: eval_,
                    isMate,
                    bestMove,
                    pv,
                    depth,
                  });
                }
              }
            }
          };
          
          worker.onerror = (err) => {
            console.error('Engine error:', err);
            get().addLog(`Engine Error: ${err.message}`);
            set({
              status: 'error',
              statusMessage: `Engine error: ${err.message}`,
              worker: null,
            });
          };
          
          // Initialize UCI
          worker.postMessage('uci');
          get().addLog('Sent: uci');
          
          set({ worker });
          
        } catch (error) {
          console.error('Failed to boot engine:', error);
          get().addLog(`Failed to boot engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
          set({
            status: 'error',
            statusMessage: `Failed to boot engine: ${error instanceof Error ? error.message : 'Unknown error'}`,
            worker: null,
          });
        }
      },
      
      // Engine Lifecycle - Shutdown (clean stop)
      shutdownEngine: () => {
        const { worker, socket, isAnalyzing } = get();
        
        console.log('Shutting down engine...');
        get().addLog('Shutting down engine...');

        if (isAnalyzing && worker) {
          worker.postMessage('stop');
        }
        
        if (worker) {
          worker.postMessage('quit');
          setTimeout(() => {
            worker.terminate();
          }, 100);
        }
        
        if (socket) {
          socket.disconnect?.();
        }
        
        set({
          worker: null,
          socket: null,
          status: 'offline',
          statusMessage: 'Engine shutdown',
          isAnalyzing: false,
          currentEvaluation: 0,
          bestMove: null,
          depth: 0,
          lines: [],
          commandLogs: [],
        });
      },
      
      // Send UCI command to engine
      sendCommand: (command) => {
        const { worker, status } = get();
        
        if (status !== 'ready' || !worker) {
          console.warn('Engine not ready, cannot send command:', command);
          return;
        }
        
        worker.postMessage(command);
      },
      
      // Reset analysis
      resetAnalysis: () => set({
        isAnalyzing: false,
        currentEvaluation: 0,
        bestMove: null,
        depth: 0,
        nps: 0,
        nodes: 0,
        time: 0,
        lines: [],
      }),
      
      // Terminate engine
      terminate: () => {
        const { worker, socket } = get();
        
        if (worker) {
          worker.terminate();
        }
        
        if (socket) {
          socket.disconnect?.();
        }
        
        set({
          worker: null,
          socket: null,
          status: 'offline',
          statusMessage: 'Engine terminated',
          isAnalyzing: false,
        });
      },
    }),
    {
      name: 'chessfish-engine-storage',
      partialize: (state) => ({
        selectedEngine: state.selectedEngine,
        status: state.status,
        multiPv: state.multiPv,
        skillLevel: state.skillLevel,
        hashSize: state.hashSize,
        threads: state.threads,
        useNNUE: state.useNNUE,
        // Engine Version
        selectedEngineVersion: state.selectedEngineVersion,
        energySavingMode: state.energySavingMode,
        // Analysis Limits
        analysisMode: state.analysisMode,
        maxDepth: state.maxDepth,
        maxTimePerMove: state.maxTimePerMove,
        // Visuals & Board
        enlargePieceOnDrag: state.enlargePieceOnDrag,
        animationSpeed: state.animationSpeed,
        drawArrows: state.drawArrows,
        arrowColorsByStrength: state.arrowColorsByStrength,
        // Notation & UX
        figurineNotation: state.figurineNotation,
        soundEnabled: state.soundEnabled,
        // Key Elements
        showPinnedPieces: state.showPinnedPieces,
        showKingInCheck: state.showKingInCheck,
        showUndefendedPieces: state.showUndefendedPieces,
        showPieceMobility: state.showPieceMobility,
        showIsolatedPawns: state.showIsolatedPawns,
        showPassedPawns: state.showPassedPawns,
        // Navigation
        activeView: state.activeView,
      }),
    }
  )
);
