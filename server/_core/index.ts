import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleResumeUpload } from "../uploadHandler";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  try {
    const app = express();
    const server = createServer(app);
    
    // Configure body parser with larger size limit for file uploads
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    
    // Serve uploaded files statically
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    
    // Resume upload handler
    app.post("/api/upload/resume", handleResumeUpload);
    
    // tRPC API
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
      })
    );
    
    // development mode uses Vite, production mode uses static files
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Heroku and other platforms assign PORT dynamically
    const preferredPort = parseInt(process.env.PORT || "3000", 10);
    
    if (isNaN(preferredPort) || preferredPort <= 0) {
      throw new Error(`Invalid PORT: ${process.env.PORT}`);
    }
    
    // In production (Heroku), use the PORT directly without checking availability
    const port = process.env.NODE_ENV === "production" 
      ? preferredPort 
      : await findAvailablePort(preferredPort);

    if (port !== preferredPort && process.env.NODE_ENV !== "production") {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    // Listen on all interfaces (0.0.0.0) for Heroku compatibility
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${port}/`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
    });
    
    // Handle server errors
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") {
        throw error;
      }
      
      const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
      
      switch (error.code) {
        case "EACCES":
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          console.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === "production") {
    console.error("Continuing despite unhandled rejection...");
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
