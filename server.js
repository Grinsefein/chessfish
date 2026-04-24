import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";
import { spawn } from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Stockfish Engine Manager
class StockfishEngine {
    constructor() {
        this.engine = null;
        this.isReady = false;
        this.analysisCallbacks = new Map();
        this.currentAnalysis = null;
        this.currentMultiPvLines = new Map();
        this.startEngine();
    }
    startEngine() {
        try {
            this.engine = spawn('/usr/local/bin/stockfish');
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
                // Restart after delay
                setTimeout(() => this.startEngine(), 1000);
            });
            // Initialize UCI
            this.sendCommand('uci');
        }
        catch (error) {
            console.error('Failed to start Stockfish:', error);
        }
    }
    sendCommand(command) {
        if (this.engine?.stdin) {
            this.engine.stdin.write(command + '\n');
        }
    }
    parseEngineOutput(output) {
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
    parseInfoLine(line) {
        const parts = line.split(' ');
        let score = 0;
        let depth = 0;
        let pv = '';
        let multipv = 1;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'score') {
                if (parts[i + 1] === 'cp') {
                    score = parseFloat(parts[i + 2]) / 100;
                }
                else if (parts[i + 1] === 'mate') {
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
            const lines = [];
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
    notifyCallbacks(bestMove) {
        if (this.currentAnalysis) {
            this.currentAnalysis.bestMove = bestMove;
            this.analysisCallbacks.forEach((callback) => {
                callback(this.currentAnalysis);
            });
            this.analysisCallbacks.clear();
        }
        this.currentAnalysis = null;
    }
    async analyze(fen, depth = 15, time = 5000, multiPv = 3) {
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
}
const stockfishEngine = new StockfishEngine();
async function startServer() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    const PORT = 4000;
    
    // Required headers for SharedArrayBuffer support
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
    });
    // Socket.io for Real-time moves/Cloud Engine
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);
        socket.on("engine:analyze", async (payload) => {
            console.log("Engine analysis requested for fen:", payload.fen, "multiPv:", payload.multiPv);
            try {
                const result = await stockfishEngine.analyze(payload.fen, payload.depth || 15, payload.time || 5000, payload.multiPv || 3);
                socket.emit("engine:result", {
                    fen: payload.fen,
                    evaluation: result.evaluation || 0,
                    bestMove: result.bestMove || '',
                    lines: result.lines || [],
                    error: result.error
                });
            }
            catch (error) {
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
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
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
