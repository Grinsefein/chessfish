import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stockfish Engine Manager
class StockfishEngine {
  private engine: ChildProcess | null = null;
  private isReady: boolean = false;
  private isActive: boolean = false;
  private analysisCallbacks: Map<string, (result: any) => void> = new Map();
  private enginePath: string = '/usr/local/bin/stockfish';

  constructor() {
    // Don't auto-start - wait for activation
  }

  activate(path?: string) {
    if (this.isActive) {
      console.log('Engine already active');
      return { success: true, message: 'Engine already active' };
    }
    
    if (path) this.enginePath = path;
    this.startEngine();
    this.isActive = true;
    return { success: true, message: 'Engine activation started' };
  }

  deactivate() {
    if (!this.isActive) {
      return { success: true, message: 'Engine already inactive' };
    }
    
    this.isActive = false;
    this.isReady = false;
    if (this.engine) {
      this.engine.kill();
      this.engine = null;
    }
    return { success: true, message: 'Engine deactivated' };
  }

  private startEngine() {
    try {
      console.log(`Starting Stockfish from: ${this.enginePath}`);
      this.engine = spawn(this.enginePath);
      
      this.engine.stdout?.on('data', (data) => {
        const output = data.toString();
        this.parseEngineOutput(output);
      });

      this.engine.stderr?.on('data', (data) => {
        console.error('Stockfish error:', data.toString());
      });

      this.engine.on('close', (code) => {
        console.log(`Stockfish process exited with code ${code}`);
        this.isReady = false;
        // Only restart if still active
        if (this.isActive) {
          setTimeout(() => this.startEngine(), 1000);
        }
      });

      // Initialize UCI
      this.sendCommand('uci');
    } catch (error) {
      console.error('Failed to start Stockfish:', error);
      this.isReady = false;
    }
  }

  private sendCommand(command: string) {
    if (this.engine?.stdin) {
      this.engine.stdin.write(command + '\n');
    }
  }

  private parseEngineOutput(output: string) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('uciok')) {
        this.isReady = true;
        this.sendCommand('setoption name MultiPV value 3');
      }
      
      if (line.startsWith('readyok')) {
        this.isReady = true;
      }

      // Parse analysis info
      if (line.startsWith('info') && line.includes('score')) {
        this.parseInfoLine(line);
      }

      // Parse bestmove
      if (line.startsWith('bestmove')) {
        const parts = line.split(' ');
        const bestMove = parts[1];
        this.notifyCallbacks(bestMove);
      }
    }
  }

  private currentAnalysis: any = null;

  private currentMultiPvLines: Map<number, any> = new Map();

  private parseInfoLine(line: string) {
    const parts = line.split(' ');
    let score = 0;
    let depth = 0;
    let pv = '';
    let multipv = 1;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'score') {
        if (parts[i + 1] === 'cp') {
          score = parseFloat(parts[i + 2]) / 100;
        } else if (parts[i + 1] === 'mate') {
          score = parseFloat(parts[i + 2]) > 0 ? 100 : -100;
        }
      }
      if (parts[i] === 'depth') {
        depth = parseInt(parts[i + 1]);
      }
      if (parts[i] === 'multipv') {
        multipv = parseInt(parts[i + 1]);
      }
      if (parts[i] === 'pv') {
        pv = parts.slice(i + 1).join(' ');
      }
    }

    // Store this line in the Multi-PV map
    if (pv) {
      this.currentMultiPvLines.set(multipv, {
        evaluation: score,
        depth,
        bestMove: pv.split(' ')[0] || '',
        pv
      });

      // Build the analysis object with all lines
      const lines: any[] = [];
      const sortedKeys = Array.from(this.currentMultiPvLines.keys()).sort((a, b) => a - b);
      for (const key of sortedKeys) {
        lines.push(this.currentMultiPvLines.get(key));
      }

      this.currentAnalysis = {
        evaluation: lines[0]?.evaluation || 0,
        bestMove: lines[0]?.bestMove || '',
        depth,
        lines
      };
    }
  }

  private notifyCallbacks(bestMove: string) {
    if (this.currentAnalysis) {
      this.currentAnalysis.bestMove = bestMove;
      this.analysisCallbacks.forEach((callback) => {
        callback(this.currentAnalysis);
      });
      this.analysisCallbacks.clear();
    }
    this.currentAnalysis = null;
  }

  async analyze(fen: string, depth: number = 15, time: number = 5000, multiPv: number = 3): Promise<any> {
    return new Promise((resolve) => {
      if (!this.isReady) {
        resolve({ error: 'Engine not ready' });
        return;
      }

      // Clear previous Multi-PV lines and set new MultiPV option
      this.currentMultiPvLines.clear();
      this.sendCommand(`setoption name MultiPV value ${multiPv}`);

      const callbackId = Date.now().toString();
      this.analysisCallbacks.set(callbackId, resolve);

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      // Timeout fallback
      setTimeout(() => {
        if (this.analysisCallbacks.has(callbackId)) {
          this.analysisCallbacks.delete(callbackId);
          resolve({ error: 'Analysis timeout' });
        }
      }, time);
    });
  }

  getStatus() {
    return {
      ready: this.isReady,
      active: this.isActive,
      engine: 'stockfish',
      path: this.enginePath
    };
  }

  updateConfig(path: string, settings: any) {
    console.log('Engine config update requested (not implemented):', path, settings);
  }
}

const stockfishEngine = new StockfishEngine();

async function startServer() {
  const app = express();

  // Enable Cross-Origin Isolation for SharedArrayBuffer (required by Stockfish WASM)
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 4000;

  // Socket.io for Real-time moves/Cloud Engine
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send initial status
    socket.emit("engine:status", stockfishEngine.getStatus());

    socket.on("engine:activate", (data) => {
      console.log("Activating server engine:", data);
      const result = stockfishEngine.activate(data?.path);
      socket.emit("engine:activation_result", result);
      io.emit("engine:status", stockfishEngine.getStatus());
    });

    socket.on("engine:deactivate", () => {
      console.log("Deactivating server engine");
      const result = stockfishEngine.deactivate();
      socket.emit("engine:deactivation_result", result);
      io.emit("engine:status", stockfishEngine.getStatus());
    });

    socket.on("engine:update_config", (data) => {
      console.log("Updating server engine config:", data);
      stockfishEngine.updateConfig(data.path, data.settings);
      io.emit("engine:status", stockfishEngine.getStatus());
    });

    socket.on("engine:analyze", async (payload) => {
      console.log("Engine analysis requested for fen:", payload.fen, "multiPv:", payload.multiPv);
      
      try {
        const result = await stockfishEngine.analyze(
          payload.fen,
          payload.depth || 15,
          payload.time || 5000,
          payload.multiPv || 3
        );
        
        socket.emit("engine:result", {
          fen: payload.fen,
          evaluation: result.evaluation || 0,
          bestMove: result.bestMove || '',
          lines: result.lines || [],
          depth: result.depth,
          error: result.error
        });
      } catch (error) {
        console.error("Analysis error:", error);
        socket.emit("engine:result", {
          fen: payload.fen,
          error: 'Analysis failed'
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Use custom to handle index.html manually
    });
    
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/socket.io')) {
        return next();
      }

      try {
        let template = await fs.promises.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error(e.stack);
        res.status(500).end(e.stack);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
