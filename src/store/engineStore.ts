import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EngineType = 'local-wasm' | 'local-legacy' | 'cloud';
export type EngineStatus = 'offline' | 'booting' | 'ready' | 'error';

interface EngineConfig {
  id: EngineType;
  name: string;
  description: string;
  url?: string;
  isCloud: boolean;
}

export const ENGINES: EngineConfig[] = [
  {
    id: 'local-wasm',
    name: 'Stockfish 16.1 (WASM)',
    description: 'Latest local engine with NNUE support',
    url: '/stockfish.js',
    isCloud: false,
  },
  {
    id: 'local-legacy',
    name: 'Stockfish 10 (Legacy)',
    description: 'Older version for compatibility',
    url: 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js',
    isCloud: false,
  },
  {
    id: 'cloud',
    name: 'Stockfish Cloud Backend',
    description: 'Server-side engine with higher depth',
    isCloud: true,
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
  socket: any | null;
  
  // Analysis results
  isAnalyzing: boolean;
  currentEvaluation: number;
  bestMove: string | null;
  depth: number;
  lines: Array<{
    evaluation: number;
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
  
  // Actions
  selectEngine: (engine: EngineType) => void;
  setStatus: (status: EngineStatus, message?: string) => void;
  setWorker: (worker: Worker | null) => void;
  setSocket: (socket: any | null) => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
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
}

export const useEngineStore = create<EngineState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedEngine: 'local-wasm',
      status: 'offline',
      statusMessage: 'Engine not started',
      
      worker: null,
      socket: null,
      
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
      
      // Select engine
      selectEngine: (engine) => {
        // Terminate current engine before switching
        get().terminate();
        set({ 
          selectedEngine: engine,
          status: 'offline',
          statusMessage: 'Engine switched. Click Boot to activate.',
          worker: null,
          socket: null,
        });
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
      
      // Start analysis
      startAnalysis: () => set({ isAnalyzing: true }),
      
      // Stop analysis
      stopAnalysis: () => {
        const { worker } = get();
        if (worker) {
          worker.postMessage('stop');
        }
        set({ isAnalyzing: false });
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
          lines.push({ evaluation: 0, bestMove: '', pv: '', depth: 0 });
        }
        lines[index] = line;
        return {
          lines,
          currentEvaluation: lines[0]?.evaluation ?? 0,
          depth: line.depth,
        };
      }),

      // Update best move after search completes
      setBestMove: (bestMove) => set((state) => ({
        bestMove,
        lines: state.lines.map((l, i) => i === 0 ? { ...l, bestMove } : l),
      })),
      
      // Set engine settings
      setEngineSettings: (settings) => set((state) => ({
        ...state,
        ...settings,
      })),
      
      // Reset analysis
      resetAnalysis: () => set({
        isAnalyzing: false,
        currentEvaluation: 0,
        bestMove: null,
        depth: 0,
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
        multiPv: state.multiPv,
        skillLevel: state.skillLevel,
        hashSize: state.hashSize,
        threads: state.threads,
        useNNUE: state.useNNUE,
      }),
    }
  )
);
