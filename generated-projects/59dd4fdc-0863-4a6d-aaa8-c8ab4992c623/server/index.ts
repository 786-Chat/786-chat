process.on('uncaughtException', (err) => {
  if (err.message?.includes('Cannot set property message') || err.message?.includes('ErrorEvent')) {
    console.error('[DB] Neon connection error caught (non-fatal):', err.message);
  } else {
    console.error('[FATAL] Uncaught exception:', err);
    process.exit(1);
  }
});

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { uploadsRouter, UPLOAD_DIR } from "./uploads";
import groceryRoutes, { setupGroceryWebSocket, seedGroceryDataIfEmpty } from "./grocery-routes";
import marketingRoutes from "./marketing-routes";
import taxiRoutes, { setupTaxiWebSocket } from "./taxi-routes";
import clothingRoutes from "./clothing-routes";
import furnitureRoutes from "./furniture-routes";
import quranRoutes from "./quran-routes";
import path from "path";
import { autoSeedBranches } from "./auto-seed";
import { seedEcommerceData } from "./seed-ecommerce";
import { syncTawaWatfordOnStartup } from "./sync-tawa-watford";
import { syncHelloMumbaiOnStartup } from "./sync-hello-mumbai";
import { storage } from "./storage";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerDisplayMenuRoutes } from "./display-menu-routes";
import { registerTvDisplayRoutes, ensureTvDisplayTable } from "./tv-display-routes";

export const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
app.use('/driver-downloads', express.static(path.join(process.cwd(), 'public/driver-downloads')));
app.use(uploadsRouter);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

let appReady = false;

app.get("/", (req, res, next) => {
  const host = (req.hostname || "").toLowerCase();
  if (host.includes("replit") || host.includes("localhost") || host.includes("127.0.0.1")) {
    if (process.env.NODE_ENV === "production") {
      const indexPath = path.join(__dirname, "public", "index.html");
      try {
        const html = require("fs").readFileSync(indexPath, "utf-8");
        return res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } catch {}
    }
    if (!appReady) {
      return res.status(200).set({ "Content-Type": "text/html" }).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="2"><style>body{background:#1a1a2e;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:white}.loader{text-align:center}.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.2);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="loader"><div class="spinner"></div><p>Loading...</p></div></body></html>`);
    }
  }
  next();
});

app.use((req, res, next) => {
  if (!appReady && !req.path.startsWith("/api/")) {
    return res.status(200).set({ "Content-Type": "text/html" }).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="2"><style>body{background:#1a1a2e;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:white}.loader{text-align:center}.spinner{width:40px;height:40px;border:3px solid rgba(255,255,255,.2);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="loader"><div class="spinner"></div><p>Loading...</p></div></body></html>`);
  }
  next();
});

(async () => {
  // LISTEN ON PORT FIRST so deployment health checks pass immediately
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });

  // Seed grocery data - non-blocking, don't delay route registration
  seedGroceryDataIfEmpty().catch((e: any) => {
    console.error("[grocery-seed] Startup seed failed:", e.message);
  });

  // Ensure TV display table exists (non-blocking)
  ensureTvDisplayTable().catch((e: any) => console.error("[TV Display] Startup table check failed:", e.message));
  
  // Register routes
  app.use(groceryRoutes);
  app.use(marketingRoutes);
  app.use(taxiRoutes);
  app.use(clothingRoutes);
  app.use(furnitureRoutes);
  app.use(quranRoutes);
  registerImageRoutes(app);
  registerDisplayMenuRoutes(app);
  registerTvDisplayRoutes(app);
  await registerRoutes(httpServer, app);

  // Setup grocery WebSocket on /grocery-ws path
  const { WebSocketServer } = await import("ws");
  const groceryWss = new WebSocketServer({ server: httpServer, path: "/grocery-ws" });
  setupGroceryWebSocket(groceryWss);

  // Setup taxi WebSocket on /taxi-ws path
  setupTaxiWebSocket(httpServer);

  // Setup clothing WebSocket on /clothing-ws path
  const { setupClothingWebSocket } = await import("./clothing-routes");
  setupClothingWebSocket(httpServer);

  // Setup furniture WebSocket on /furniture-ws path
  const { setupFurnitureWebSocket } = await import("./furniture-routes");
  setupFurnitureWebSocket(httpServer);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const createBranchBrandingMiddleware = (pageType: "menu" | "welcome") => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      const slug = req.params.slug;
      try {
        const restaurant = await storage.getRestaurantBySlug(slug);
        if (restaurant) {
          const originalEnd = res.end.bind(res);
          const originalSend = res.send.bind(res);
          const escapedName = restaurant.name.replace(/"/g, '&quot;');
          const manifestUrl = `/api/restaurants/${restaurant.slug}/manifest.json?page=${pageType}`;
          const iconUrl = restaurant.logoUrl || "/icon-customer-512.png";

          const injectBranding = (html: string): string => {
            let result = html;
            result = result.replace(/<link rel="manifest" href="[^"]*">/g, `<link rel="manifest" href="${manifestUrl}">`);
            result = result.replace(/<link rel="apple-touch-icon"[^>]*>/g, `<link rel="apple-touch-icon" href="${iconUrl}">`);
            result = result.replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/g, `<meta name="apple-mobile-web-app-title" content="${escapedName}">`);
            if (restaurant.primaryColor) {
              result = result.replace(/<meta name="theme-color" content="[^"]*">/g, `<meta name="theme-color" content="${restaurant.primaryColor}">`);
            }
            result = result.replace(/<meta property="og:title" content="[^"]*" \/>/g, `<meta property="og:title" content="${escapedName}" />`);
            if (result.includes('<title>')) {
              result = result.replace(/<title>[^<]*<\/title>/g, `<title>${escapedName}</title>`);
            } else {
              result = result.replace('</head>', `  <title>${escapedName}</title>\n  </head>`);
            }
            return result;
          };

          const setNoCacheHeaders = () => {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          };

          (res as any).send = function(body: any) {
            if (typeof body === 'string' && body.includes('apple-mobile-web-app-title')) {
              body = injectBranding(body);
              setNoCacheHeaders();
            }
            return originalSend(body);
          };

          (res as any).end = function(chunk: any, ...args: any[]) {
            if (typeof chunk === 'string' && chunk.includes('apple-mobile-web-app-title')) {
              chunk = injectBranding(chunk);
              setNoCacheHeaders();
            }
            return originalEnd(chunk, ...args);
          };
        }
      } catch (e) {
      }
      next();
    };
  };

  app.use('/menu/:slug', createBranchBrandingMiddleware("menu"));
  app.use('/r/:slug', createBranchBrandingMiddleware("welcome"));
  app.use('/restaurant/:slug', createBranchBrandingMiddleware("welcome"));
  app.use('/:slug/welcome', createBranchBrandingMiddleware("welcome"));
  app.use('/:slug/menu', createBranchBrandingMiddleware("menu"));

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const urlPath = req.path;
    if (urlPath !== '/' && urlPath !== '/index.html') return next();
    
    try {
      const hostname = (req.hostname || (req.headers.host || '').replace(/:\d+$/, '')).toLowerCase().replace(/\.$/, '');
      const normalizeDomain = (d: string) => d.toLowerCase().trim().replace(/\.$/, '').replace(/^www\./, '');
      const cleanHost = normalizeDomain(hostname);
      
      const isSubdomain = cleanHost.endsWith('.link24.online') && 
        cleanHost !== 'link24.online' && 
        cleanHost !== 'www.link24.online';
      const isCustomDomain = !cleanHost.includes('replit') && 
        !cleanHost.includes('localhost') && 
        !cleanHost.includes('127.0.0.1') &&
        cleanHost !== 'link24.online' &&
        cleanHost !== 'www.link24.online' &&
        !isSubdomain &&
        cleanHost.length > 0;

      if (isSubdomain || isCustomDomain) {
        const restaurants = await storage.getAllRestaurants();
        const restaurant = restaurants.find((r: any) => {
          const customDomain = r.customDomain;
          if (!customDomain) return false;
          return normalizeDomain(customDomain) === cleanHost;
        });

        if (restaurant) {
          const originalSend = res.send.bind(res);
          const originalEnd = res.end.bind(res);
          const name = restaurant.name || '';
          const logo = (restaurant as any).logo || '';
          const slug = restaurant.slug || '';
          const escapedName = name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          
          const injectBranding = (html: string): string => {
            let result = html;
            result = result.replace(
              /content="Link24"/g,
              `content="${escapedName}"`
            );
            if (logo) {
              result = result.replace(
                /href="\/icon-192\.png"/g,
                `href="${logo}"`
              );
              result = result.replace(
                /href="\/icon-512\.png"/g,
                `href="${logo}"`
              );
            }
            result = result.replace(
              /href="\/manifest\.json[^"]*"/g,
              `href="/api/restaurants/${slug}/manifest.json?page=welcome"`
            );
            if (result.includes('<title>')) {
              result = result.replace(/<title>[^<]*<\/title>/g, `<title>${escapedName}</title>`);
            }
            return result;
          };
          
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');

          (res as any).send = function(body: any) {
            if (typeof body === 'string' && body.includes('apple-mobile-web-app-title')) {
              body = injectBranding(body);
            }
            return originalSend(body);
          };

          (res as any).end = function(chunk: any, ...args: any[]) {
            if (typeof chunk === 'string' && chunk.includes('apple-mobile-web-app-title')) {
              chunk = injectBranding(chunk);
            }
            return originalEnd(chunk, ...args);
          };
        }
      }
    } catch (e) {
    }
    next();
  });

  // Setup vite or static serving
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  await seedEcommerceData();

  appReady = true;
  log("Application fully initialized");

  // Background sync (disabled - manual management mode)
  setTimeout(() => {
    console.log("[Sync] Starting background sync...");
    console.log("[Sync] Background sync skipped (manual management mode)!");
  }, 1000);
})();