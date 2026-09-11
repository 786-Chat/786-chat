// @ts-nocheck
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import cookieParser from 'cookie-parser';
import path from 'path';
import { storage } from './storage.js';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add cookie parser for admin tokens
app.use(cookieParser());

// Serve static files from uploads directory with proper headers
app.use('/uploads', express.static(path.join(process.env.TMPDIR || "/tmp", "uploads"), {
  maxAge: '365d', // Cache for 1 year (24-month policy)
  setHeaders: (res, filePath) => {
    // Set cache headers for better performance and 24-month retention
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('ETag', `"${Date.now()}"`);
    
    // Set proper MIME types for images
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// Serve static files from attached_assets directory (fallback for older files)
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets'), {
  maxAge: '365d', // Cache for 1 year (24-month policy)
  setHeaders: (res, filePath) => {
    // Set cache headers for better performance and 24-month retention
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('ETag', `"${Date.now()}"`);
    
    // Set proper MIME types for images
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

// Serve static files from data directory (logos, documents, photos, reports)
app.use('/data', express.static(path.join(process.cwd(), 'data'), {
  maxAge: '365d', // Cache for 1 year (24-month policy for lifetime logo storage)
  setHeaders: (res, filePath) => {
    // Set cache headers for better performance and 24-month retention
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('ETag', `"${Date.now()}"`);
    
    // Set proper MIME types for all file types
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
    
    // Log logo serving for debugging
    if (filePath.includes('logo')) {
      console.log(`Serving logo with lifetime storage: ${path.basename(filePath)} (${mimeTypes[ext] || 'unknown'}) from ${filePath}`);
    }
  }
}));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// CRITICAL: DISABLED AUTOMATIC REPAIR TO PREVENT DATA LOSS
// These functions were rewriting file paths and causing files to disappear
// User data must persist permanently - no automatic cleanup allowed
(async () => {
  console.log('✅ STARTUP: Automatic repair functions DISABLED to protect user data');
  console.log('📋 All files will persist permanently unless manually deleted by user');
  
  const server = await registerRoutes(app);

  // Start IoT alarm polling for Smart Mouser devices
  try {
    const tuyaService = await import("./tuya-service.js");
    tuyaService.startAlarmPolling(storage);
  } catch (e: any) {
    console.error("Failed to start IoT polling:", e.message);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files from public directory first
  app.use(express.static(path.resolve(import.meta.dirname, '..', 'public'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.svg')) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // Serve uploaded files (logos, documents, photos)
  app.use('/uploads', express.static(path.resolve(import.meta.dirname, '..', 'uploads'), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'; object-src 'self'");
      } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Content-Type', 'image/' + ext.substring(1));
      }
    }
  }));
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  if (!process.env.VERCEL) server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
