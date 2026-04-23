import { useState, useEffect, useRef, useCallback } from 'react';

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

  const reboot = useCallback(() => {
    setRebootKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let worker: Worker | null = null;
    let objectURL: string | null = null;
    
    async function initStockfish() {
      try {
        setError(null);
        setIsReady(false);

        // Versioned URL for better reliability
        const cdnUrls = [
          'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js',
          'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js'
        ];

        let stockfishCode = '';
        let lastErr = null;

        for (const url of cdnUrls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              stockfishCode = await response.text();
              break;
            }
          } catch (e) {
            lastErr = e;
          }
        }

        if (!stockfishCode) {
          throw new Error('Failed to fetch Stockfish library. Please check your network connection.');
        }

        const workerScript = `
          (function() {
            var originalOnMessage = self.onmessage;
            self.onmessage = null; // Clear to detect if the library sets it

            ${stockfishCode}
            
            var StockfishFn = self.Stockfish || self.STOCKFISH || self.StockfishWasm;
            
            // Try Module-based detection first for newer builds
            if (!StockfishFn && self.Module) {
               if (typeof self.Module.Stockfish === 'function') StockfishFn = self.Module.Stockfish;
               else if (typeof self.Module === 'function') StockfishFn = self.Module;
            }

            // Detect exported as a function directly (some builds do this)
            if (!StockfishFn && typeof self['stockfish.js'] === 'function') StockfishFn = self['stockfish.js'];
            
            // If the library didn't provide a factory but set onmessage, it's a standalone worker
            if (!StockfishFn && typeof self.onmessage === 'function' && self.onmessage !== originalOnMessage) {
              var libOnMessage = self.onmessage;
              self.onmessage = function(event) { libOnMessage(event); };
              postMessage('debug: engine initialized (standalone mode)');
              return;
            }

            // Fallback for legacy flat builds that expose uci_command or main
            if (!StockfishFn && (typeof self._uci_command === 'function' || typeof self._main === 'function')) {
              StockfishFn = function() {
                var engine = {
                  postMessage: function(msg) { try { if (self._uci_command) self._uci_command(msg); } catch(e) {} },
                  onmessage: null
                };
                var nativePostMessage = self.postMessage;
                self.postMessage = function(msg) {
                  if (engine.onmessage) engine.onmessage({ data: msg });
                  nativePostMessage(msg);
                };
                if (typeof self._main === 'function') setTimeout(function() { try { self._main(); } catch(e) {} }, 0);
                return engine;
              };
            }

            if (StockfishFn) {
              var engine = typeof StockfishFn === 'function' ? StockfishFn() : StockfishFn;
              
              if (engine && typeof engine.then === 'function') {
                engine.then(function(instance) {
                  setupEngine(instance);
                });
              } else {
                setupEngine(engine);
              }

              function setupEngine(e) {
                e.onmessage = function(event) {
                  postMessage(typeof event === 'string' ? event : event.data);
                };
                
                onmessage = function(event) {
                  e.postMessage(event.data);
                };
                postMessage('debug: engine initialized successfully');
              }
            } else {
              postMessage('error: Stockfish function not found. Available: ' + Object.keys(self).filter(k => k.length < 50).join(', '));
            }
          })();
        `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        objectURL = URL.createObjectURL(blob);
        
        try {
          worker = new Worker(objectURL);
        } catch (e) {
          throw new Error('Worker setup failed. Your browser may have blocked standard Web Workers.');
        }

        workerRef.current = worker;
        
        worker.onerror = (err: ErrorEvent) => {
          console.error("Worker Execution Error:", err);
          setError("Stockfish Worker Error: Execution failed.");
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

      } catch (err) {
        console.error('Failed to initialize Stockfish:', err);
        setError('Engine load failed: ' + err.message);
      }
    }

    initStockfish();

    return () => {
      if (worker) worker.terminate();
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [multiPV, rebootKey]);

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

  return { isReady, error, analyze, stop, result, setOptions, evaluateFen, reboot };
}
