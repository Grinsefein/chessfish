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

type EngineStatus = "offline" | "booting" | "ready" | "error";
type EngineVersion = "stockfish-13" | "stockfish-14" | "stockfish-16" | "stockfish-18" | "lc0";
type AnalysisMode = "depth" | "time";

interface EngineLine {
  evaluation: number;
  isMate: boolean;
  bestMove: string;
  pv: string;
  depth: number;
}

interface EngineInfoPayload {
  fen: string | null;
  evaluation: number;
  bestMove: string | null;
  depth: number;
  nps: number;
  nodes: number;
  time: number;
  lines: EngineLine[];
}

interface CloudEngineConfig {
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

interface EngineRuntimeSnapshot {
  id: "cloud";
  engine: "stockfish";
  engineVersion: EngineVersion;
  active: boolean;
  ready: boolean;
  status: EngineStatus;
  statusMessage: string;
  path: string;
}

interface CloudEngineSnapshot {
  runtime: EngineRuntimeSnapshot;
  config: CloudEngineConfig;
  logs: string[];
}

const DEFAULT_ENGINE_CONFIG: CloudEngineConfig = {
  threads: 4,
  hashSize: 128,
  multiPv: 3,
  skillLevel: 20,
  useNNUE: true,
  analysisMode: "depth",
  maxDepth: 20,
  maxTimePerMove: 5,
  energySavingMode: false,
};

class StockfishEngine extends EventEmitter {
  private engine: ChildProcess | null = null;
  private isReady = false;
  private isActive = false;
  private status: EngineStatus = "offline";
  private statusMessage = "Backend engine offline";
  private currentFen: string | null = null;
  private enginePath = "/usr/local/bin/stockfish";
  private engineVersion: EngineVersion = "stockfish-16";
  private currentAnalysis: EngineInfoPayload | null = null;
  private currentMultiPvLines: Map<number, EngineLine> = new Map();
  private logs: string[] = [];
  private readonly maxLogs = 200;
  private readonly config: CloudEngineConfig = { ...DEFAULT_ENGINE_CONFIG };

  private addLog(message: string) {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.emit("log", logEntry);
  }

  private setStatus(status: EngineStatus, statusMessage: string) {
    this.status = status;
    this.statusMessage = statusMessage;
    this.emit("status", this.getRuntimeSnapshot());
  }

  private normalizeConfig(update: Partial<CloudEngineConfig>) {
    const nextConfig: CloudEngineConfig = {
      ...this.config,
      ...update,
    };

    nextConfig.threads = Math.max(1, Math.min(16, Math.round(nextConfig.threads)));
    nextConfig.hashSize = Math.max(16, Math.min(2048, Math.round(nextConfig.hashSize)));
    nextConfig.multiPv = Math.max(1, Math.min(5, Math.round(nextConfig.multiPv)));
    nextConfig.skillLevel = Math.max(0, Math.min(20, Math.round(nextConfig.skillLevel)));
    nextConfig.maxDepth = Math.max(1, Math.min(40, Math.round(nextConfig.maxDepth)));
    nextConfig.maxTimePerMove = Math.max(1, Math.min(60, Math.round(nextConfig.maxTimePerMove)));

    return nextConfig;
  }

  private getRuntimeSnapshot(): EngineRuntimeSnapshot {
    return {
      id: "cloud",
      engine: "stockfish",
      engineVersion: this.engineVersion,
      active: this.isActive,
      ready: this.isReady,
      status: this.status,
      statusMessage: this.statusMessage,
      path: this.enginePath,
    };
  }

  getSnapshot(): CloudEngineSnapshot {
    return {
      runtime: this.getRuntimeSnapshot(),
      config: { ...this.config },
      logs: [...this.logs],
    };
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.addLog("Logs cleared");
    this.emit("logs", this.getLogs());
    this.emit("snapshot", this.getSnapshot());
    return { success: true, message: "Logs cleared" };
  }

  activate(options?: { path?: string; engineVersion?: EngineVersion }) {
    if (options?.path) {
      this.enginePath = options.path;
    }
    if (options?.engineVersion) {
      this.engineVersion = options.engineVersion;
    }

    if (this.isActive) {
      this.addLog("Engine already active");
      this.emit("snapshot", this.getSnapshot());
      return { success: true, message: "Engine already active" };
    }

    this.isActive = true;
    this.isReady = false;
    this.setStatus("booting", "Backend engine initializing...");
    this.startEngine();
    this.emit("snapshot", this.getSnapshot());
    return { success: true, message: "Engine activation started" };
  }

  deactivate() {
    if (!this.isActive) {
      this.emit("snapshot", this.getSnapshot());
      return { success: true, message: "Engine already inactive" };
    }

    this.isActive = false;
    this.isReady = false;

    if (this.engine) {
      this.engine.kill();
      this.engine = null;
    }

    this.currentFen = null;
    this.currentAnalysis = null;
    this.currentMultiPvLines.clear();
    this.addLog("Engine deactivated");
    this.setStatus("offline", "Backend engine offline");
    this.emit("snapshot", this.getSnapshot());
    return { success: true, message: "Engine deactivated" };
  }

  private startEngine() {
    try {
      this.addLog(`Starting Stockfish from: ${this.enginePath}`);
      this.engine = spawn(this.enginePath);

      this.engine.stdout?.on("data", (data) => {
        this.parseEngineOutput(data.toString());
      });

      this.engine.stderr?.on("data", (data) => {
        this.addLog(`STDERR: ${data.toString().trim()}`);
      });

      this.engine.on("error", (error) => {
        this.addLog(`Failed to start Stockfish: ${error.message}`);
        this.isReady = false;
        this.setStatus("error", "Backend engine failed to start");
        this.emit("snapshot", this.getSnapshot());
      });

      this.engine.on("close", (code) => {
        this.addLog(`Stockfish process exited with code ${code}`);
        this.engine = null;
        this.isReady = false;

        if (!this.isActive) {
          this.setStatus("offline", "Backend engine offline");
          this.emit("snapshot", this.getSnapshot());
          return;
        }

        this.setStatus("booting", "Backend engine restarting...");
        this.emit("snapshot", this.getSnapshot());
        setTimeout(() => {
          if (this.isActive) {
            this.startEngine();
          }
        }, 1000);
      });

      this.sendCommand("uci");
    } catch (error) {
      this.addLog(`Failed to start Stockfish: ${error instanceof Error ? error.message : String(error)}`);
      this.isReady = false;
      this.setStatus("error", "Backend engine failed to start");
      this.emit("snapshot", this.getSnapshot());
    }
  }

  private applyUciConfig() {
    this.sendCommand(`setoption name Hash value ${this.config.hashSize}`);
    this.sendCommand(`setoption name Threads value ${this.config.threads}`);
    this.sendCommand(`setoption name MultiPV value ${this.config.multiPv}`);
    this.sendCommand(`setoption name Skill Level value ${this.config.skillLevel}`);
    this.sendCommand(`setoption name Use NNUE value ${this.config.useNNUE ? "true" : "false"}`);
  }

  private sendCommand(command: string) {
    if (this.engine?.stdin) {
      this.addLog(`Sent: ${command}`);
      this.engine.stdin.write(`${command}\n`);
    }
  }

  private parseEngineOutput(output: string) {
    const lines = output.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      this.addLog(`Engine: ${trimmedLine}`);

      if (trimmedLine.startsWith("uciok")) {
        this.applyUciConfig();
        this.sendCommand("isready");
      }

      if (trimmedLine.startsWith("readyok")) {
        this.isReady = true;
        this.setStatus("ready", "Backend engine ready");
        this.emit("snapshot", this.getSnapshot());
      }

      if (trimmedLine.startsWith("info") && trimmedLine.includes("depth")) {
        this.parseInfoLine(trimmedLine);
      }

      if (trimmedLine.startsWith("bestmove")) {
        const parts = trimmedLine.split(" ");
        const bestMove = parts[1];
        if (this.currentAnalysis) {
          this.currentAnalysis.bestMove = bestMove === "(none)" ? null : bestMove;
          this.emit("result", {
            fen: this.currentFen,
            ...this.currentAnalysis,
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

    let evaluation = 0;
    let isMate = false;

    if (cpMatch) {
      evaluation = parseInt(cpMatch[1], 10) / 100;
    } else if (mateMatch) {
      evaluation = parseInt(mateMatch[1], 10);
      isMate = true;
    }

    const pv = pvMatch ? pvMatch[1] : "";
    const bestMove = pv ? pv.split(" ")[0] : "";

    this.currentMultiPvLines.set(multipv, {
      evaluation,
      isMate,
      bestMove,
      pv,
      depth,
    });

    const lines = Array.from(this.currentMultiPvLines.entries())
      .sort(([a], [b]) => a - b)
      .map(([, value]) => value);

    this.currentAnalysis = {
      fen: this.currentFen,
      evaluation: lines[0]?.evaluation || 0,
      bestMove: lines[0]?.bestMove || null,
      depth,
      nps,
      nodes,
      time,
      lines,
    };

    this.emit("info", {
      fen: this.currentFen,
      ...this.currentAnalysis,
    });
  }

  applyConfig(update: Partial<CloudEngineConfig> & { engineVersion?: EngineVersion }) {
    const normalizedConfig = this.normalizeConfig(update);
    Object.assign(this.config, normalizedConfig);

    if (update.engineVersion) {
      this.engineVersion = update.engineVersion;
    }

    this.addLog(
      `Config updated: version=${this.engineVersion}, threads=${this.config.threads}, hash=${this.config.hashSize}, multipv=${this.config.multiPv}`
    );

    if (this.engine && this.isReady) {
      this.applyUciConfig();
      this.sendCommand("isready");
      this.isReady = false;
      this.setStatus("booting", "Applying backend engine settings...");
    }

    this.emit("snapshot", this.getSnapshot());
    return this.getSnapshot();
  }

  async analyze(fen: string, depth?: number, multiPv?: number, time?: number) {
    if (!this.isReady) {
      return;
    }

    const analysisDepth = depth ?? this.config.maxDepth;
    const analysisMultiPv = multiPv ?? this.config.multiPv;
    const analysisTime = time ?? this.config.maxTimePerMove * 1000;

    this.currentFen = fen;
    this.currentMultiPvLines.clear();
    this.currentAnalysis = null;

    this.sendCommand("stop");
    this.sendCommand("ucinewgame");
    this.sendCommand(`setoption name MultiPV value ${analysisMultiPv}`);
    this.sendCommand(`position fen ${fen}`);

    if (this.config.analysisMode === "time" && !depth) {
      this.sendCommand(`go movetime ${analysisTime}`);
    } else {
      this.sendCommand(`go depth ${analysisDepth}`);
    }
  }

  stop() {
    this.sendCommand("stop");
  }
}

const stockfishEngine = new StockfishEngine();

async function startServer() {
  const app = express();
  app.use(express.json());

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

  const emitSnapshot = (snapshot = stockfishEngine.getSnapshot()) => {
    io.emit("engine:snapshot", snapshot);
    io.emit("engine:status", snapshot.runtime);
    io.emit("engine:logs", snapshot.logs);
  };

  stockfishEngine.on("snapshot", (snapshot) => emitSnapshot(snapshot));
  stockfishEngine.on("status", (status) => io.emit("engine:status", status));
  stockfishEngine.on("info", (info) => io.emit("engine:info", info));
  stockfishEngine.on("result", (result) => io.emit("engine:result", result));
  stockfishEngine.on("log", (log) => io.emit("engine:log", log));
  stockfishEngine.on("logs", (logs) => io.emit("engine:logs", logs));

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    const snapshot = stockfishEngine.getSnapshot();
    socket.emit("engine:snapshot", snapshot);
    socket.emit("engine:status", snapshot.runtime);
    socket.emit("engine:logs", snapshot.logs);

    socket.on("engine:hydrate", (callback?: (snapshot: CloudEngineSnapshot) => void) => {
      const nextSnapshot = stockfishEngine.getSnapshot();
      callback?.(nextSnapshot);
      socket.emit("engine:snapshot", nextSnapshot);
    });

    socket.on("engine:activate", (data, callback?: (snapshot: CloudEngineSnapshot) => void) => {
      stockfishEngine.activate({
        path: data?.path,
        engineVersion: data?.engineVersion,
      });
      callback?.(stockfishEngine.getSnapshot());
    });

    socket.on("engine:deactivate", (_data, callback?: (snapshot: CloudEngineSnapshot) => void) => {
      stockfishEngine.deactivate();
      callback?.(stockfishEngine.getSnapshot());
    });

    socket.on("engine:stop", () => {
      stockfishEngine.stop();
    });

    socket.on("engine:update_config", (payload, callback?: (snapshot: CloudEngineSnapshot) => void) => {
      const update = payload?.settings ?? payload ?? {};
      const nextSnapshot = stockfishEngine.applyConfig(update);
      callback?.(nextSnapshot);
    });

    socket.on("engine:clear_logs", (_payload, callback?: (snapshot: CloudEngineSnapshot) => void) => {
      stockfishEngine.clearLogs();
      callback?.(stockfishEngine.getSnapshot());
    });

    socket.on("engine:analyze", (payload) => {
      stockfishEngine.analyze(
        payload.fen,
        payload.depth,
        payload.multiPv,
        payload.time
      );
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  app.get("/api/engine/hydrate", (_req, res) => {
    res.json(stockfishEngine.getSnapshot());
  });

  app.get("/api/engine/status", (_req, res) => {
    res.json(stockfishEngine.getSnapshot().runtime);
  });

  app.get("/api/engine/logs", (_req, res) => {
    res.json(stockfishEngine.getLogs());
  });

  app.post("/api/engine/activate", (req, res) => {
    stockfishEngine.activate(req.body);
    res.json(stockfishEngine.getSnapshot());
  });

  app.post("/api/engine/deactivate", (_req, res) => {
    stockfishEngine.deactivate();
    res.json(stockfishEngine.getSnapshot());
  });

  app.post("/api/engine/config", (req, res) => {
    res.json(stockfishEngine.applyConfig(req.body ?? {}));
  });

  app.post("/api/engine/clear-logs", (_req, res) => {
    stockfishEngine.clearLogs();
    res.json(stockfishEngine.getSnapshot());
  });

  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api") || url.startsWith("/socket.io")) return next();

      try {
        let template = await fs.promises.readFile(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (error: any) {
        vite.ssrFixStacktrace(error);
        res.status(500).end(error.stack);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
