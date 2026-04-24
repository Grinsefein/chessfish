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

export interface EngineLine {
  evaluation: number;
  isMate: boolean;
  bestMove: string;
  pv: string;
  depth: number;
}

export interface CloudEngineRuntime {
  id: 'cloud';
  engine: 'stockfish';
  engineVersion: EngineVersion;
  active: boolean;
  ready: boolean;
  status: EngineStatus;
  statusMessage: string;
  path: string;
}

export interface CloudEngineConfig {
  threads: number;
  hashSize: number;
  multiPv: number;
  skillLevel: number;
  useNNUE: boolean;
  analysisMode: AnalysisMode;
  maxDepth: number;
  maxTimePerMove: number;
  energySavingMode: boolean;
}

export interface CloudEngineSnapshot {
  runtime: CloudEngineRuntime;
  config: CloudEngineConfig;
  logs: string[];
}

const CLOUD_ENGINE_URL = 'http://localhost:4000';

export const ENGINES: EngineConfig[] = [
  {
    id: 'cloud',
    name: 'Stockfish Cloud',
    description: 'Shared server-side Stockfish runtime, synced across clients',
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

export const ENGINE_VERSIONS: Array<{ id: EngineVersion; label: string; description: string }> = [
  { id: 'stockfish-13', label: 'Stockfish 13', description: 'Older backend profile' },
  { id: 'stockfish-14', label: 'Stockfish 14', description: 'Balanced compatibility profile' },
  { id: 'stockfish-16', label: 'Stockfish 16', description: 'Current default backend profile' },
  { id: 'stockfish-18', label: 'Stockfish 18', description: 'Latest backend profile slot' },
  { id: 'lc0', label: 'Lc0', description: 'Reserved cloud profile slot' },
];

const LOCAL_SAFE_DEFAULTS = {
  threads: 1,
  hashSize: 32,
  multiPv: 1,
  maxDepth: 12,
  maxTimePerMove: 2,
  energySavingMode: true,
};

const defaultCloudRuntime: CloudEngineRuntime = {
  id: 'cloud',
  engine: 'stockfish',
  engineVersion: 'stockfish-16',
  active: false,
  ready: false,
  status: 'offline',
  statusMessage: 'Backend engine offline',
  path: '/usr/local/bin/stockfish',
};

const defaultCloudConfig: CloudEngineConfig = {
  threads: 4,
  hashSize: 128,
  multiPv: 3,
  skillLevel: 20,
  useNNUE: true,
  analysisMode: 'depth',
  maxDepth: 20,
  maxTimePerMove: 5,
  energySavingMode: false,
};

interface EngineState {
  selectedEngine: EngineType;
  status: EngineStatus;
  statusMessage: string;
  worker: Worker | null;
  socket: Socket | null;
  cloudRuntime: CloudEngineRuntime;
  isRefreshingSnapshot: boolean;
  lastHydratedAt: number | null;
  commandLogs: string[];
  isAnalyzing: boolean;
  currentEvaluation: number;
  bestMove: string | null;
  depth: number;
  nps: number;
  nodes: number;
  time: number;
  lines: EngineLine[];
  multiPv: number;
  skillLevel: number;
  hashSize: number;
  threads: number;
  useNNUE: boolean;
  selectedEngineVersion: EngineVersion;
  energySavingMode: boolean;
  analysisMode: AnalysisMode;
  maxDepth: number;
  maxTimePerMove: number;
  enlargePieceOnDrag: boolean;
  animationSpeed: AnimationSpeed;
  drawArrows: boolean;
  arrowColorsByStrength: boolean;
  figurineNotation: boolean;
  soundEnabled: boolean;
  showPinnedPieces: boolean;
  showKingInCheck: boolean;
  showUndefendedPieces: boolean;
  showPieceMobility: boolean;
  showIsolatedPawns: boolean;
  showPassedPawns: boolean;
  activeView: ActiveView;
  init: () => void;
  selectEngine: (engine: EngineType) => void;
  setStatus: (status: EngineStatus, message?: string) => void;
  setWorker: (worker: Worker | null) => void;
  setSocket: (socket: Socket | null) => void;
  addLog: (message: string) => void;
  clearLogs: () => Promise<void>;
  connectCloudEngine: () => Socket;
  disconnectCloudEngine: () => void;
  hydrateCloudSnapshot: (snapshot: CloudEngineSnapshot) => void;
  refreshCloudSnapshot: () => Promise<void>;
  applyCloudConfig: (settings: Partial<CloudEngineConfig> & { engineVersion?: EngineVersion }) => Promise<void>;
  subscribeToCloudLogs: () => void;
  bootEngine: () => Promise<void>;
  shutdownEngine: () => void;
  sendCommand: (command: string) => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  analyze: (fen: string) => void;
  setAnalysisResult: (result: {
    evaluation: number;
    bestMove: string | null;
    depth: number;
    lines: EngineLine[];
  }) => void;
  updateLine: (index: number, line: EngineLine) => void;
  setBestMove: (bestMove: string | null) => void;
  setEngineSettings: (settings: Partial<Pick<EngineState, 'multiPv' | 'skillLevel' | 'hashSize' | 'threads' | 'useNNUE'>>) => void;
  resetAnalysis: () => void;
  terminate: () => void;
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
  setShowPinnedPieces: (enabled: boolean) => void;
  setShowKingInCheck: (enabled: boolean) => void;
  setShowUndefendedPieces: (enabled: boolean) => void;
  setShowPieceMobility: (enabled: boolean) => void;
  setShowIsolatedPawns: (enabled: boolean) => void;
  setShowPassedPawns: (enabled: boolean) => void;
  setActiveView: (view: ActiveView) => void;
}

const appendUniqueLog = (logs: string[], nextLog: string) => {
  if (logs[logs.length - 1] === nextLog) {
    return logs;
  }

  if (logs.includes(nextLog)) {
    return logs;
  }

  return [...logs, nextLog];
};

const resetAnalysisState = {
  isAnalyzing: false,
  currentEvaluation: 0,
  bestMove: null,
  depth: 0,
  nps: 0,
  nodes: 0,
  time: 0,
  lines: [] as EngineLine[],
};

const getSafeLocalEngineSettings = (selectedEngine: EngineType, state: Pick<EngineState, 'threads' | 'hashSize' | 'multiPv' | 'maxDepth' | 'maxTimePerMove'>) => {
  const hardwareThreads = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
    ? navigator.hardwareConcurrency
    : 2;

  const safeThreadCap = selectedEngine === 'local-legacy' ? 1 : Math.max(1, Math.min(2, Math.floor(hardwareThreads / 2) || 1));
  const safeThreads = Math.max(1, Math.min(state.threads, safeThreadCap));
  const safeHashSize = Math.max(16, Math.min(state.hashSize, selectedEngine === 'local-legacy' ? 16 : 64));
  const safeMultiPv = Math.max(1, Math.min(state.multiPv, 2));
  const safeDepth = Math.max(8, Math.min(state.maxDepth, 14));
  const safeMoveTime = Math.max(1, Math.min(state.maxTimePerMove, 3));

  return {
    threads: safeThreads,
    hashSize: safeHashSize,
    multiPv: safeMultiPv,
    maxDepth: safeDepth,
    maxTimePerMove: safeMoveTime,
  };
};

const applyRuntimeToState = (
  set: (updater: Partial<EngineState> | ((state: EngineState) => Partial<EngineState>)) => void,
  get: () => EngineState,
  runtime: CloudEngineRuntime
) => {
  set((state) => {
    const nextState: Partial<EngineState> = {
      cloudRuntime: runtime,
      selectedEngineVersion: runtime.engineVersion,
    };

    if (state.selectedEngine === 'cloud') {
      nextState.status = runtime.status;
      nextState.statusMessage = runtime.statusMessage;
    }

    return nextState;
  });
};

const registerCloudListeners = (
  socket: Socket,
  set: (updater: Partial<EngineState> | ((state: EngineState) => Partial<EngineState>)) => void,
  get: () => EngineState
) => {
  socket.removeAllListeners();

  socket.on('connect', () => {
    const { selectedEngine } = get();
    if (selectedEngine === 'cloud') {
      set({ status: 'booting', statusMessage: 'Syncing backend engine...' });
    }
    get().refreshCloudSnapshot();
  });

  socket.on('engine:snapshot', (snapshot: CloudEngineSnapshot) => {
    get().hydrateCloudSnapshot(snapshot);
  });

  socket.on('engine:status', (runtime: CloudEngineRuntime) => {
    applyRuntimeToState(set, get, runtime);
  });

  socket.on('engine:logs', (logs: string[]) => {
    set({ commandLogs: logs });
  });

  socket.on('engine:log', (log: string) => {
    set((state) => ({ commandLogs: appendUniqueLog(state.commandLogs, log) }));
  });

  socket.on('engine:info', (info: { nps?: number; nodes?: number; time?: number; lines?: EngineLine[]; depth?: number }) => {
    if (info.nps !== undefined) set({ nps: info.nps });
    if (info.nodes !== undefined) set({ nodes: info.nodes });
    if (info.time !== undefined) set({ time: info.time });

    if (info.lines) {
      info.lines.forEach((line, idx) => {
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

  socket.on('engine:result', (result: { error?: string; bestMove?: string | null; lines?: EngineLine[]; depth?: number }) => {
    if (result.error) {
      set({ isAnalyzing: false });
      return;
    }

    if (result.bestMove !== undefined) {
      get().setBestMove(result.bestMove ?? null);
    }

    if (result.lines) {
      result.lines.forEach((line, idx) => {
        get().updateLine(idx, {
          evaluation: line.evaluation,
          isMate: line.isMate || false,
          bestMove: line.bestMove,
          pv: line.pv,
          depth: result.depth || line.depth,
        });
      });
    }

    set({ isAnalyzing: false });
  });

  socket.on('disconnect', () => {
    const { selectedEngine, cloudRuntime } = get();
    const disconnectedRuntime: CloudEngineRuntime = {
      ...cloudRuntime,
      ready: false,
      status: 'offline',
      statusMessage: 'Backend connection lost',
    };

    applyRuntimeToState(set, get, disconnectedRuntime);

    if (selectedEngine === 'cloud') {
      set({ status: 'offline', statusMessage: 'Backend connection lost' });
    }
  });

  socket.on('connect_error', (err) => {
    if (get().selectedEngine === 'cloud') {
      set({ status: 'error', statusMessage: `Backend connection failed: ${err.message}` });
    }
  });
};

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      selectedEngine: 'cloud',
      status: 'offline',
      statusMessage: 'Engine not started',
      worker: null,
      socket: null,
      cloudRuntime: defaultCloudRuntime,
      isRefreshingSnapshot: false,
      lastHydratedAt: null,
      commandLogs: [],
      isAnalyzing: false,
      currentEvaluation: 0,
      bestMove: null,
      depth: 0,
      nps: 0,
      nodes: 0,
      time: 0,
      lines: [],
      multiPv: 3,
      skillLevel: 20,
      hashSize: 128,
      threads: 4,
      useNNUE: true,
      selectedEngineVersion: 'stockfish-16',
      energySavingMode: false,
      analysisMode: 'depth',
      maxDepth: 20,
      maxTimePerMove: 5,
      enlargePieceOnDrag: true,
      animationSpeed: 'default',
      drawArrows: true,
      arrowColorsByStrength: true,
      figurineNotation: false,
      soundEnabled: true,
      showPinnedPieces: false,
      showKingInCheck: true,
      showUndefendedPieces: false,
      showPieceMobility: false,
      showIsolatedPawns: false,
      showPassedPawns: false,
      activeView: 'play',

      init: () => {
        const { selectedEngine, socket, worker, status } = get();

        if (selectedEngine === 'cloud') {
          get().connectCloudEngine();
          get().refreshCloudSnapshot();
          return;
        }

        if ((status === 'ready' || status === 'booting') && !socket && !worker) {
          get().bootEngine();
        }
      },

      selectEngine: (engine) => {
        const previousEngine = get().selectedEngine;

        if (previousEngine === engine) {
          if (engine === 'cloud') {
            get().refreshCloudSnapshot();
          }
          return;
        }

        if (previousEngine === 'cloud') {
          get().disconnectCloudEngine();
        } else {
          get().terminate();
        }

        set({
          selectedEngine: engine,
          status: 'offline',
          statusMessage: engine === 'cloud' ? 'Syncing backend engine...' : 'Engine switched.',
          worker: null,
          isAnalyzing: false,
          ...resetAnalysisState,
          ...(engine === 'cloud' ? {} : LOCAL_SAFE_DEFAULTS),
        });

        if (engine === 'cloud') {
          get().connectCloudEngine();
          get().refreshCloudSnapshot();
        }
      },

      setStatus: (status, message) => set({
        status,
        statusMessage: message || get().statusMessage,
      }),

      setWorker: (worker) => set({ worker }),
      setSocket: (socket) => set({ socket }),

      addLog: (message) => set((state) => ({
        commandLogs: [...state.commandLogs, `[${new Date().toLocaleTimeString()}] ${message}`],
      })),

      clearLogs: async () => {
        if (get().selectedEngine === 'cloud') {
          const socket = get().connectCloudEngine();
          socket.emit('engine:clear_logs');
          return;
        }

        set({ commandLogs: [] });
      },

      connectCloudEngine: () => {
        const existingSocket = get().socket;
        if (existingSocket) {
          if (!existingSocket.connected) {
            existingSocket.connect();
          }
          return existingSocket;
        }

        const socket = io(CLOUD_ENGINE_URL, {
          autoConnect: true,
          transports: ['websocket', 'polling'],
        });

        registerCloudListeners(socket, set, get);
        set({ socket });
        return socket;
      },

      disconnectCloudEngine: () => {
        const { socket } = get();
        if (socket) {
          socket.removeAllListeners();
          socket.disconnect();
        }

        set({ socket: null });
      },

      hydrateCloudSnapshot: (snapshot) => {
        applyRuntimeToState(set, get, snapshot.runtime);
        set((state) => ({
          threads: snapshot.config.threads,
          hashSize: snapshot.config.hashSize,
          multiPv: snapshot.config.multiPv,
          skillLevel: snapshot.config.skillLevel,
          useNNUE: snapshot.config.useNNUE,
          analysisMode: snapshot.config.analysisMode,
          maxDepth: snapshot.config.maxDepth,
          maxTimePerMove: snapshot.config.maxTimePerMove,
          energySavingMode: snapshot.config.energySavingMode,
          commandLogs: snapshot.logs,
          isRefreshingSnapshot: false,
          lastHydratedAt: Date.now(),
          status: state.selectedEngine === 'cloud' ? snapshot.runtime.status : state.status,
          statusMessage: state.selectedEngine === 'cloud' ? snapshot.runtime.statusMessage : state.statusMessage,
        }));
      },

      refreshCloudSnapshot: async () => {
        set({ isRefreshingSnapshot: true });

        try {
          const response = await fetch('/api/engine/hydrate');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const snapshot = (await response.json()) as CloudEngineSnapshot;
          get().hydrateCloudSnapshot(snapshot);
        } catch (error) {
          const socket = get().connectCloudEngine();
          socket.emit('engine:hydrate', (snapshot: CloudEngineSnapshot) => {
            get().hydrateCloudSnapshot(snapshot);
          });

          if (get().selectedEngine === 'cloud') {
            set({
              status: 'booting',
              statusMessage: `Waiting for backend snapshot${error instanceof Error ? `: ${error.message}` : ''}`,
            });
          }
        } finally {
          set({ isRefreshingSnapshot: false });
        }
      },

      applyCloudConfig: async (settings) => {
        const socket = get().connectCloudEngine();
        socket.emit('engine:update_config', settings);
      },

      subscribeToCloudLogs: () => {
        const socket = get().connectCloudEngine();
        socket.emit('engine:hydrate', (snapshot: CloudEngineSnapshot) => {
          get().hydrateCloudSnapshot(snapshot);
        });
      },

      bootEngine: async () => {
        const state = get();

        if (state.selectedEngine === 'cloud') {
          const socket = get().connectCloudEngine();
          set({
            status: 'booting',
            statusMessage: 'Requesting backend engine activation...',
            ...resetAnalysisState,
          });

          socket.emit('engine:activate', {
            engineVersion: state.selectedEngineVersion,
          });
          return;
        }

        if (state.status === 'booting' || state.status === 'ready') {
          return;
        }

        set({
          status: 'booting',
          statusMessage: 'Initializing engine...',
          ...resetAnalysisState,
        });

        try {
          const engineConfig = ENGINES.find((engine) => engine.id === state.selectedEngine);

          if (!engineConfig) {
            throw new Error('Engine configuration not found');
          }

          let workerUrl = engineConfig.url || '/stockfish.js';
          const safeLocalSettings = getSafeLocalEngineSettings(state.selectedEngine, state);

          if (engineConfig.id === 'local-wasm' && typeof SharedArrayBuffer === 'undefined') {
            workerUrl = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-single.js';
          }

          if (workerUrl.startsWith('http')) {
            const blob = new Blob([`importScripts('${workerUrl}');`], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
          }

          const worker = new Worker(workerUrl, { type: 'classic' });

          worker.onmessage = (event) => {
            const rawMessage = event.data;
            if (typeof rawMessage !== 'string') return;

            get().addLog(`Engine: ${rawMessage}`);
            const messages = rawMessage.split('\n');

            for (let message of messages) {
              message = message.trim();
              if (!message) continue;

              if (message.includes('uciok')) {
                const current = get();
                const safeCurrent = getSafeLocalEngineSettings(current.selectedEngine, current);
                worker.postMessage(`setoption name Hash value ${safeCurrent.hashSize}`);
                worker.postMessage(`setoption name Threads value ${safeCurrent.threads}`);
                worker.postMessage(`setoption name MultiPV value ${safeCurrent.multiPv}`);
                worker.postMessage(`setoption name Skill Level value ${Math.min(current.skillLevel, 12)}`);
                worker.postMessage(`setoption name Use NNUE value ${current.useNNUE ? 'true' : 'false'}`);
                worker.postMessage('isready');
              }

              if (message.includes('readyok')) {
                set({
                  status: 'ready',
                  statusMessage: `${engineConfig.name} ready`,
                });
              }

              if (message.startsWith('bestmove')) {
                const match = message.match(/bestmove\s+(\S+)/);
                get().setBestMove(match && match[1] !== '(none)' ? match[1] : null);
                set({ isAnalyzing: false });
              }

              if (message.startsWith('info') && message.includes('depth')) {
                const depthMatch = message.match(/depth\s+(\d+)/);
                const cpMatch = message.match(/score\s+cp\s+(-?\d+)/);
                const mateMatch = message.match(/score\s+mate\s+(-?\d+)/);
                const multipvMatch = message.match(/multipv\s+(\d+)/);
                const pvMatch = message.match(/pv\s+(.+)/);
                const npsMatch = message.match(/nps\s+(\d+)/);
                const nodesMatch = message.match(/nodes\s+(\d+)/);
                const timeMatch = message.match(/time\s+(\d+)/);

                if (!depthMatch) continue;

                const depth = parseInt(depthMatch[1], 10);
                const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
                const nps = npsMatch ? parseInt(npsMatch[1], 10) : get().nps;
                const nodes = nodesMatch ? parseInt(nodesMatch[1], 10) : get().nodes;
                const time = timeMatch ? parseInt(timeMatch[1], 10) : get().time;

                set({ nps, nodes, time });

                let evaluation = 0;
                let isMate = false;

                if (cpMatch) {
                  evaluation = parseInt(cpMatch[1], 10) / 100;
                } else if (mateMatch) {
                  evaluation = parseInt(mateMatch[1], 10);
                  isMate = true;
                }

                const pv = pvMatch ? pvMatch[1] : '';
                const bestMove = pv ? pv.split(' ')[0] : '';

                get().updateLine(multipv - 1, {
                  evaluation,
                  isMate,
                  bestMove,
                  pv,
                  depth,
                });
              }
            }
          };

          worker.onerror = (error) => {
            set({
              status: 'error',
              statusMessage: `Engine error: ${error.message}`,
              worker: null,
            });
          };

          worker.postMessage('uci');
          get().addLog('Sent: uci');
          set({
            worker,
            threads: safeLocalSettings.threads,
            hashSize: safeLocalSettings.hashSize,
            multiPv: safeLocalSettings.multiPv,
            maxDepth: safeLocalSettings.maxDepth,
            maxTimePerMove: safeLocalSettings.maxTimePerMove,
            energySavingMode: true,
          });
        } catch (error) {
          set({
            status: 'error',
            statusMessage: `Failed to boot engine: ${error instanceof Error ? error.message : 'Unknown error'}`,
            worker: null,
          });
        }
      },

      shutdownEngine: () => {
        const { selectedEngine, worker, socket, isAnalyzing } = get();

        if (selectedEngine === 'cloud') {
          if (socket) {
            socket.emit('engine:deactivate');
          }
          set({
            isAnalyzing: false,
            ...resetAnalysisState,
          });
          return;
        }

        if (isAnalyzing && worker) {
          worker.postMessage('stop');
        }

        if (worker) {
          worker.postMessage('quit');
          setTimeout(() => worker.terminate(), 100);
        }

        set({
          worker: null,
          status: 'offline',
          statusMessage: 'Engine shutdown',
          commandLogs: [],
          ...resetAnalysisState,
        });
      },

      sendCommand: (command) => {
        const { worker, status, selectedEngine } = get();
        if (selectedEngine === 'cloud' || status !== 'ready' || !worker) {
          return;
        }

        worker.postMessage(command);
      },

      startAnalysis: () => {
        const { worker, status, selectedEngine, analysisMode, maxDepth, maxTimePerMove } = get();
        if (selectedEngine !== 'cloud' && worker && status === 'ready') {
          const safeLocalSettings = getSafeLocalEngineSettings(selectedEngine, get());
          worker.postMessage('stop');
          if (analysisMode === 'depth') {
            worker.postMessage(`go depth ${Math.min(maxDepth, safeLocalSettings.maxDepth)}`);
          } else {
            worker.postMessage(`go movetime ${Math.min(maxTimePerMove, safeLocalSettings.maxTimePerMove) * 1000}`);
          }
          set({ isAnalyzing: true });
        }
      },

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

      analyze: (fen) => {
        const { worker, socket, status, analysisMode, maxDepth, maxTimePerMove, multiPv, selectedEngine } = get();
        if (status !== 'ready') return;

        set({
          isAnalyzing: true,
          ...resetAnalysisState,
        });

        if (selectedEngine !== 'cloud' && worker) {
          const safeLocalSettings = getSafeLocalEngineSettings(selectedEngine, get());
          worker.postMessage('stop');
          worker.postMessage('ucinewgame');
          worker.postMessage(`position fen ${fen}`);

          if (analysisMode === 'depth') {
            worker.postMessage(`go depth ${Math.min(maxDepth, safeLocalSettings.maxDepth)}`);
          } else {
            worker.postMessage(`go movetime ${Math.min(maxTimePerMove, safeLocalSettings.maxTimePerMove) * 1000}`);
          }
        }

        if (selectedEngine === 'cloud' && socket) {
          socket.emit('engine:analyze', {
            fen,
            depth: analysisMode === 'depth' ? maxDepth : undefined,
            multiPv,
            time: analysisMode === 'time' ? maxTimePerMove * 1000 : undefined,
          });
        }
      },

      setAnalysisResult: (result) => set({
        currentEvaluation: result.evaluation,
        bestMove: result.bestMove,
        depth: result.depth,
        lines: result.lines,
      }),

      updateLine: (index, line) => set((state) => {
        const lines = [...state.lines];
        while (lines.length <= index) {
          lines.push({ evaluation: 0, isMate: false, bestMove: '', pv: '', depth: 0 });
        }
        lines[index] = line;

        return {
          lines,
          currentEvaluation: index === 0 ? line.evaluation : state.currentEvaluation,
          depth: index === 0 ? Math.max(state.depth, line.depth) : state.depth,
        };
      }),

      setBestMove: (bestMove) => set((state) => ({
        bestMove,
        lines: state.lines.map((line, index) => (
          index === 0 && !line.bestMove ? { ...line, bestMove: bestMove || '' } : line
        )),
      })),

      setEngineSettings: (settings) => {
        const { selectedEngine, worker, status } = get();

        if (selectedEngine === 'cloud') {
          void get().applyCloudConfig(settings);
          return;
        }

        if (status === 'ready' && worker) {
          const mergedState = { ...get(), ...settings };
          const safeLocalSettings = getSafeLocalEngineSettings(selectedEngine, mergedState);
          if (settings.hashSize !== undefined) worker.postMessage(`setoption name Hash value ${safeLocalSettings.hashSize}`);
          if (settings.threads !== undefined) worker.postMessage(`setoption name Threads value ${safeLocalSettings.threads}`);
          if (settings.multiPv !== undefined) worker.postMessage(`setoption name MultiPV value ${safeLocalSettings.multiPv}`);
          if (settings.skillLevel !== undefined) worker.postMessage(`setoption name Skill Level value ${settings.skillLevel}`);
          if (settings.useNNUE !== undefined) worker.postMessage(`setoption name Use NNUE value ${settings.useNNUE ? 'true' : 'false'}`);
          worker.postMessage('isready');
        }

        const safeLocalSettings = getSafeLocalEngineSettings(selectedEngine, { ...get(), ...settings });
        set({
          ...settings,
          threads: settings.threads !== undefined ? safeLocalSettings.threads : get().threads,
          hashSize: settings.hashSize !== undefined ? safeLocalSettings.hashSize : get().hashSize,
          multiPv: settings.multiPv !== undefined ? safeLocalSettings.multiPv : get().multiPv,
        });
      },

      resetAnalysis: () => set({ ...resetAnalysisState }),

      terminate: () => {
        const { worker } = get();

        if (worker) {
          worker.terminate();
        }

        set({
          worker: null,
          status: 'offline',
          statusMessage: 'Engine terminated',
          ...resetAnalysisState,
        });
      },

      setEngineVersion: (version) => {
        if (get().selectedEngine === 'cloud') {
          void get().applyCloudConfig({ engineVersion: version });
          return;
        }

        set({ selectedEngineVersion: version });
      },

      setEnergySavingMode: (enabled) => {
        if (get().selectedEngine === 'cloud') {
          void get().applyCloudConfig({ energySavingMode: enabled });
          return;
        }

        set({ energySavingMode: enabled });
      },

      setAnalysisMode: (mode) => {
        if (get().selectedEngine === 'cloud') {
          void get().applyCloudConfig({ analysisMode: mode });
          return;
        }

        set({ analysisMode: mode });
      },

      setMaxDepth: (depth) => {
        if (get().selectedEngine === 'cloud') {
          void get().applyCloudConfig({ maxDepth: depth });
          return;
        }

        set({ maxDepth: depth });
      },

      setMaxTimePerMove: (seconds) => {
        if (get().selectedEngine === 'cloud') {
          void get().applyCloudConfig({ maxTimePerMove: seconds });
          return;
        }

        set({ maxTimePerMove: seconds });
      },

      setEnlargePieceOnDrag: (enabled) => set({ enlargePieceOnDrag: enabled }),
      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      setDrawArrows: (enabled) => set({ drawArrows: enabled }),
      setArrowColorsByStrength: (enabled) => set({ arrowColorsByStrength: enabled }),
      setFigurineNotation: (enabled) => set({ figurineNotation: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setShowPinnedPieces: (enabled) => set({ showPinnedPieces: enabled }),
      setShowKingInCheck: (enabled) => set({ showKingInCheck: enabled }),
      setShowUndefendedPieces: (enabled) => set({ showUndefendedPieces: enabled }),
      setShowPieceMobility: (enabled) => set({ showPieceMobility: enabled }),
      setShowIsolatedPawns: (enabled) => set({ showIsolatedPawns: enabled }),
      setShowPassedPawns: (enabled) => set({ showPassedPawns: enabled }),
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'chessfish-engine-storage',
      partialize: (state) => ({
        selectedEngine: state.selectedEngine,
        multiPv: state.multiPv,
        skillLevel: state.skillLevel,
        hashSize: state.hashSize,
        threads: state.threads,
        useNNUE: state.useNNUE,
        selectedEngineVersion: state.selectedEngineVersion,
        energySavingMode: state.energySavingMode,
        analysisMode: state.analysisMode,
        maxDepth: state.maxDepth,
        maxTimePerMove: state.maxTimePerMove,
        enlargePieceOnDrag: state.enlargePieceOnDrag,
        animationSpeed: state.animationSpeed,
        drawArrows: state.drawArrows,
        arrowColorsByStrength: state.arrowColorsByStrength,
        figurineNotation: state.figurineNotation,
        soundEnabled: state.soundEnabled,
        showPinnedPieces: state.showPinnedPieces,
        showKingInCheck: state.showKingInCheck,
        showUndefendedPieces: state.showUndefendedPieces,
        showPieceMobility: state.showPieceMobility,
        showIsolatedPawns: state.showIsolatedPawns,
        showPassedPawns: state.showPassedPawns,
        activeView: state.activeView,
      }),
    }
  )
);
