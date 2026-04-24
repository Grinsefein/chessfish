import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import { EventEmitter } from "events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stockfish Engine Manager
class StockfishEngine extends EventEmitter {
  private engine: ChildProcess | null = null;
  private isReady: boolean = false;
  private isActive: boolean = false;
  private currentFen: string | null = null;
  private enginePath: string = '/usr/local/bin/stockfish';
  private currentAnalysis: any = null;
  private currentMultiPvLines: Map<number, any> = new Map();
  private logs: string[] = [];
  private maxLogs: number = 100;

  constructor() {
    super();
  }

  private addLog(message: string) {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.emit('log', logEntry);
  }

  getLogs() {
    return this.logs;
  }

  activate(path?: string) {
    if (this.isActive) {
      this.addLog('Engine already active');
      return { success: true, message: 'Engine already active' };
    }
    
    if (path) this.enginePath = path;
    this.startEngine();
    this.isActive = true;
    this.emit('status', this.getStatus());
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
    this.addLog('Engine deactivated');
    this.emit('status', this.getStatus());
    return { success: true, message: 'Engine deactivated' };
  }

  private startEngine() {
    try {
      this.addLog(`Starting Stockfish from: ${this.enginePath}`);
      this.engine = spawn(this.enginePath);
      
      this.engine.stdout?.on('data', (data) => {
        const output = data.toString();
        this.parseEngineOutput(output);
      });

      this.engine.stderr?.on('data', (data) => {
        this.addLog(`STDERR: ${data.toString()}`);
      });

      this.engine.on('close', (code) => {
        this.addLog(`Stockfish process exited with code ${code}`);
        this.isReady = false;
        this.emit('status', this.getStatus());
        // Only restart if still active
        if (this.isActive) {
          setTimeout(() => this.startEngine(), 1000);
        }
      });

      // Initialize UCI
      this.sendCommand('uci');
    } catch (error) {
      this.addLog(`Failed to start Stockfish: ${error}`);
      this.isReady = false;
      this.emit('status', this.getStatus());
    }
  }

  public sendCommand(command: string) {
    if (this.engine?.stdin) {
      this.addLog(`Sent: ${command}`);
      this.engine.stdin.write(command + '\n');
    }
  }

  private parseEngineOutput(output: string) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      this.addLog(`Engine: ${trimmedLine}`);

      if (trimmedLine.startsWith('uciok')) {
        this.sendCommand('isready');
      }
      
      if (trimmedLine.startsWith('readyok')) {
        this.isReady = true;
        this.emit('status', this.getStatus());
      }

      // Parse analysis info
      if (trimmedLine.startsWith('info') && trimmedLine.includes('depth')) {
        this.parseInfoLine(trimmedLine);
      }

      // Parse bestmove
      if (trimmedLine.startsWith('bestmove')) {
        const parts = trimmedLine.split(' ');
        const bestMove = parts[1];
        if (this.currentAnalysis) {
          this.currentAnalysis.bestMove = bestMove === '(none)' ? null : bestMove;
          this.emit('result', {
            fen: this.currentFen,
            ...this.currentAnalysis
          });
          this.currentAnalysis = null;
        }
      }
    }
  }

  private parseInfoLine(line: string) {
    const depthMatch = line.match(/depth\s+(\d+)/);
    const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
    const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);
    const multipvMatch = line.match(/multipv\s+(\d+)/);
    const pvMatch = line.match(/pv\s+(.+)/);
    const npsMatch = line.match(/nps\s+(\d+)/);
    const nodesMatch = line.match(/nodes\s+(\d+)/);
    const timeMatch = line.match(/time\s+(\d+)/);

    if (!depthMatch) return;

    const depth = parseInt(depthMatch[1], 10);
    const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
    const nps = npsMatch ? parseInt(npsMatch[1], 10) : 0;
    const nodes = nodesMatch ? parseInt(nodesMatch[1], 10) : 0;
    const time = timeMatch ? parseInt(timeMatch[1], 10) : 0;
...
      this.currentAnalysis = {
        evaluation: lines[0]?.evaluation || 0,
        bestMove: lines[0]?.bestMove || '',
        depth,
        nps,
        nodes,
        time,
        lines
      };

      this.emit('info', {
        fen: this.currentFen,
        ...this.currentAnalysis
      });
    }
  }

  async analyze(fen: string, depth: number = 15, multiPv: number = 3) {
    if (!this.isReady) return;

    this.currentFen = fen;
    this.currentMultiPvLines.clear();
    this.currentAnalysis = null;
    
    this.sendCommand('stop');
    this.sendCommand('ucinewgame');
    this.sendCommand(`setoption name MultiPV value ${multiPv}`);
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }

  stop() {
    this.sendCommand('stop');
  }

  getStatus() {
    return {
      ready: this.isReady,
      active: this.isActive,
      engine: 'stockfish',
      path: this.enginePath
    };
  }
}

const stockfishEngine = new StockfishEngine();

async function startServer() {
  const app = express();

  // Enable Cross-Origin Isolation for SharedArrayBuffer
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

  // Broadcast engine events to all clients
  stockfishEngine.on('status', (status) => io.emit('engine:status', status));
  stockfishEngine.on('info', (info) => io.emit('engine:info', info));
  stockfishEngine.on('result', (result) => io.emit('engine:result', result));
  stockfishEngine.on('log', (log) => io.emit('engine:log', log));

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send initial status and logs
    socket.emit("engine:status", stockfishEngine.getStatus());
    socket.emit("engine:logs", stockfishEngine.getLogs());

    socket.on("engine:activate", (data) => {
      stockfishEngine.activate(data?.path);
    });

    socket.on("engine:deactivate", () => {
      stockfishEngine.deactivate();
    });

    socket.on("engine:stop", () => {
      stockfishEngine.stop();
    });

    socket.on("engine:analyze", (payload) => {
      stockfishEngine.analyze(payload.fen, payload.depth || 15, payload.multiPv || 3);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API routes
  app.get("/api/engine/status", (req, res) => {
    res.json(stockfishEngine.getStatus());
  });

  app.get("/api/engine/logs", (req, res) => {
    res.json(stockfishEngine.getLogs());
  });

  // Vite middleware for development
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    
    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/socket.io')) return next();

      try {
        let template = await fs.promises.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        res.status(500).end(e.stack);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
