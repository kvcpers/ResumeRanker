import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy load vite config to avoid issues in production bundle
// This function is only called in development mode
async function getViteConfig() {
  // Only try to load vite config in development
  // In production, setupVite is never called
  if (process.env.NODE_ENV === "development") {
    try {
      const viteConfig = await import("../../vite.config.js");
      return viteConfig.default || viteConfig;
    } catch (e) {
      console.warn("Could not load vite config:", e);
      return {};
    }
  }
  return {};
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const viteConfig = await getViteConfig();
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the built files are in dist/public (relative to project root)
  // When running from dist/index.js, we need to go up one level to find dist/public
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `⚠️  Could not find the build directory: ${distPath}, make sure to build the client first`
    );
    console.error(`Current working directory: ${process.cwd()}`);
    
    // Don't crash, but log a warning
    // The static middleware will just not serve files, but the API will still work
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.status(500).send(`
        <html>
          <body>
            <h1>Build Error</h1>
            <p>Static files not found. Expected directory: ${distPath}</p>
            <p>Please ensure the build completed successfully.</p>
          </body>
        </html>
      `);
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Index.html not found");
    }
  });
}
