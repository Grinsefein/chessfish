import { useState, useEffect, useRef, useCallback } from 'react';
import { NNUEFile, getDefaultNNUE, downloadNNUE, isNNUEAvailable } from '@/services/nnueService';

export interface EngineLine {
  evaluation: number;
  bestMove: string;
  pv: string;
  depth: number;
}

export interface EngineResult {
  evaluation: number;
  bestMove: string;
  depth: number;
  lines: EngineLine[];
  error?: string;
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [multiPV, setMultiPVState] = useState(3);
  const [rebootKey, setRebootKey] = useState(0);
  const [nnueEnabled, setNnueEnabled] = useState(true);
  const [currentNNUE, setCurrentNNUE] = useState<NNUEFile | null>(getDefaultNNUE);
  const [nnueDownloadProgress, setNnueDownloadProgress] = useState<number | null>(null);
  const [engineVersion, setEngineVersionState] = useState('Stockfish 16.1 (WASM)');
  const [isActive, setIsActive] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('chessfish_engineActive') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('chessfish_engineActive', isActive.toString());
  }, [isActive]);

  const ENGINE_VERSIONS = [
    { name: 'Stockfish 16.1 (WASM)', url: 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16.js' },
    { name: 'Stockfish 16 (NNUE)', url: 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16.js' },
    { name: 'Stockfish 10 (Legacy)', url: 'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js' }
  ];

  const setEngineVersion = useCallback((name: string) => {
    setEngineVersionState(name);
    reboot();
  }, []);

  const reboot = useCallback(() => {
    setRebootKey(prev => prev + 1);
  }, []);

  const setNNUEEnabled = useCallback((enabled: boolean) => {
    setNnueEnabled(enabled);
    if (workerRef.current) {
      workerRef.current.postMessage(`setoption name Use NNUE value ${enabled}`);
    }
  }, []);

  const setNNUEFile = useCallback(async (file: NNUEFile) => {
    if (!isNNUEAvailable(file.name)) {
      setNnueDownloadProgress(0);
      const downloaded = await downloadNNUE(file, (progress) => {
        setNnueDownloadProgress(progress);
      });
      setNnueDownloadProgress(null);
      if (!downloaded) {
        throw new Error(`Failed to download NNUE file: ${file.name}`);
      }
    }
    setCurrentNNUE(file);
    if (workerRef.current) {
      workerRef.current.postMessage(`setoption name EvalFile value ${file.name}`);
    }
  }, []);

  const refreshNNUE = useCallback(() => {
    setCurrentNNUE(getDefaultNNUE());
  }, []);

  useEffect(() => {
    if (!isActive) {
      setIsReady(false);
      return;
    }
    let worker: Worker | null = null;

    async function initStockfish() {
      try {
        setError(null);
        setIsReady(false);

        // Use local stockfish.js from public directory with absolute path
        // This ensures the worker file is correctly loaded in both dev and production
        const workerUrl = '/stockfish.js';

        try {
          worker = new Worker(workerUrl, { type: 'classic' });
        } catch (e) {
          console.error("Worker creation error:", e);
          throw new Error('Failed to initialize Stockfish worker. Please check that /stockfish.js exists in the public directory.');
        }

        workerRef.current = worker;

        worker.onerror = (err: ErrorEvent) => {
          console.error("Worker Execution Error:", err);
          setError("Stockfish Worker Error: " + (err.message || "Execution failed"));
        };

        worker.onmessage = (e) => {
          const msg = e.data;
          
          if (typeof msg === 'string' && msg.startsWith('debug:')) {
            console.log('Stockfish Worker Debug:', msg);
            if (msg.includes('initialized successfully') || msg.includes('initialized (standalone mode)')) {
              setIsReady(true);
            }
            return;
          }

          if (typeof msg === 'string' && msg.startsWith('error:')) {
            console.error('Stockfish Worker Error:', msg);
            setError(msg.replace('error: ', ''));
            return;
          }
          
          if (typeof msg !== 'string') return;

          if (msg.includes('Stockfish')) {
            setIsReady(true);
          }

          // Parse Multi-PV
          if (msg.includes('depth') && msg.includes('multipv')) {
            const depthMatch = msg.match(/depth (\d+)/);
            const multipvMatch = msg.match(/multipv (\d+)/);
            const cpMatch = msg.match(/score cp (-?\d+)/);
            const mateMatch = msg.match(/score mate (-?\d+)/);
            const pvMatch = msg.match(/pv (.+)/);
            
            if (depthMatch && multipvMatch && pvMatch) {
              const depth = parseInt(depthMatch[1]);
              const pvRank = parseInt(multipvMatch[1]); // 1-indexed rank
              const pvIdx = pvRank - 1;
              const pv = pvMatch[1];
              const bestMove = pv.split(' ')[0];
              
              let evalVal = 0;
              if (cpMatch) {
                evalVal = parseInt(cpMatch[1]) / 100;
              } else if (mateMatch) {
                evalVal = parseInt(mateMatch[1]) > 0 ? 99 : -99;
              }

              setResult(prev => {
                // Keep lines in a stable array by rank index
                const currentLines = prev?.lines ? [...prev.lines] : [];
                
                // Ensure we have enough slots
                while (currentLines.length < pvRank) {
                    currentLines.push({ evaluation: 0, bestMove: '', pv: '', depth: 0 });
                }

                currentLines[pvIdx] = {
                  depth,
                  evaluation: evalVal,
                  bestMove,
                  pv
                };
                
                // Only use the top line for the main evaluation
                return {
                  evaluation: currentLines[0]?.evaluation ?? 0,
                  bestMove: currentLines[0]?.bestMove ?? '',
                  depth,
                  lines: currentLines
                };
              });
            }
          }
          
          if (msg.startsWith('bestmove')) {
            const move = msg.split(' ')[1];
            setResult(prev => prev ? ({
              ...prev,
              bestMove: move,
            }) : null);
          }
        };

        worker.postMessage('uci');
        worker.postMessage('isready');
        worker.postMessage(`setoption name MultiPV value ${multiPV}`);
        worker.postMessage(`setoption name Use NNUE value ${nnueEnabled}`);
        if (currentNNUE) {
          worker.postMessage(`setoption name EvalFile value ${currentNNUE.name}`);
        }

      } catch (err) {
        console.error('Failed to initialize Stockfish:', err);
        setError('Engine load failed: ' + err.message);
      }
    }

    initStockfish();

    return () => {
      if (worker) worker.terminate();
    };
  }, [multiPV, rebootKey, isActive]);

  const analyze = useCallback((fen: string, depth = 12) => {
    if (!workerRef.current || !isReady) return;
    setResult(null); // Clear previous results
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth}`);
  }, [isReady]);

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop');
  }, []);

  const setOptions = useCallback((options: Record<string, string | number>) => {
    if (!workerRef.current) return;
    Object.entries(options).forEach(([name, value]) => {
      workerRef.current?.postMessage(`setoption name ${name} value ${value}`);
      if (name === 'MultiPV') {
        setMultiPVState(Number(value));
        setResult(null); // Clear to re-calculate with new Multi-PV
      }
    });
  }, []);

  const evaluateFen = useCallback((fen: string, depth = 10): Promise<number> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) {
        resolve(0);
        return;
      }
      
      const handleMsg = (e: MessageEvent) => {
        const msg = e.data;
        if (typeof msg === 'string' && msg.includes('depth ' + depth) && msg.includes('score')) {
          const cpMatch = msg.match(/score cp (-?\d+)/);
          const mateMatch = msg.match(/score mate (-?\d+)/);
          let val = 0;
          if (cpMatch) val = parseInt(cpMatch[1]) / 100;
          else if (mateMatch) val = parseInt(mateMatch[1]) > 0 ? 99 : -99;
          
          workerRef.current?.removeEventListener('message', handleMsg);
          resolve(val);
        }
      };

      workerRef.current.addEventListener('message', handleMsg);
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    });
  }, [isReady]);

  return {
    isReady,
    error,
    analyze,
    stop,
    result,
    setOptions,
    evaluateFen,
    reboot,
    nnueEnabled,
    setNNUEEnabled,
    currentNNUE,
    setNNUEFile,
    nnueDownloadProgress,
    refreshNNUE,
    engineVersion,
    setEngineVersion,
    ENGINE_VERSIONS,
    isActive,
    setIsActive
  };
}
