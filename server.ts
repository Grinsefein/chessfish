import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // Socket.io for Real-time moves/Cloud Engine
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("engine:analyze", (payload) => {
      // Phase 5: Cloud Engine Logic could go here
      // For now, just mock a response or broadcast
      console.log("Engine analysis requested for fen:", payload.fen);
      // Simulated delay
      setTimeout(() => {
        socket.emit("engine:result", {
          fen: payload.fen,
          evaluation: (Math.random() * 2 - 1).toFixed(2),
          bestMove: "e2e4",
        });
      }, 500);
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
