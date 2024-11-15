import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { createServer } from "http";
import { setupAuth } from "./auth";
import escrowRoutes from "./routes/escrow";
import transactionRoutes from "./routes/transactions";
import notificationRoutes from "./routes/notifications";
import { autoReleaseJob } from "./jobs/autoRelease";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Enhanced error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorDetails = {
    message: err.message,
    code: err.code || 'SERVER_ERROR',
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  console.error('Server error:', errorDetails);

  res.status(errorDetails.status).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : errorDetails.message,
      code: errorDetails.code
    }
  });
};

const app = express();
const server = createServer(app);

// Increase JSON limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Enhanced logging middleware with request tracking
const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      auth: req.isAuthenticated() ? 'authenticated' : 'anonymous'
    });
  });

  (req as any).requestId = requestId;
  next();
};

app.use(loggingMiddleware);

// Setup authentication
setupAuth(app);

// Register API routes
app.use('/api/escrow', escrowRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
registerRoutes(app);

// Setup static file serving or development server
if (process.env.NODE_ENV === "development") {
  try {
    setupVite(app, server);
    console.log('Development server setup complete');
  } catch (error) {
    console.error('Failed to setup development server:', error);
    process.exit(1);
  }
} else {
  // Enhanced static file serving configuration
  const staticPath = path.join(PROJECT_ROOT, 'dist');
  const clientPath = path.join(staticPath, 'client');
  
  console.log('Static file configuration:', {
    projectRoot: PROJECT_ROOT,
    staticPath,
    clientPath,
    exists: {
      staticPath: fs.existsSync(staticPath),
      clientPath: fs.existsSync(clientPath)
    }
  });

  // Ensure directories exist
  if (!fs.existsSync(clientPath)) {
    fs.mkdirSync(clientPath, { recursive: true });
    console.log('Created client directory:', clientPath);
  }

  // Configure static file serving with MIME types and caching
  app.use(express.static(clientPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false,
    setHeaders: (res, filepath) => {
      const ext = path.extname(filepath).toLowerCase();
      
      // Set proper MIME types
      const mimeTypes: Record<string, string> = {
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject'
      };

      const mimeType = mimeTypes[ext];
      if (mimeType) {
        res.setHeader('Content-Type', mimeType);
      }

      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Cache control based on file type
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // SPA fallback route
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    const indexPath = path.join(clientPath, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      console.error('Index file not found:', indexPath);
      return res.status(500).json({
        error: {
          message: 'Server configuration error',
          code: 'STATIC_FILE_ERROR'
        }
      });
    }

    res.sendFile(indexPath, err => {
      if (err) {
        console.error('Failed to send index.html:', {
          error: err.message,
          path: indexPath,
          requestId: (req as any).requestId
        });
        next(err);
      }
    });
  });
}

// Error handling middleware should be last
app.use(errorHandler);

// Graceful shutdown handler
const shutdownHandler = (signal: string) => {
  console.info(`${signal} signal received: closing HTTP server`);
  
  try {
    autoReleaseJob.stop();
    console.log('Auto-release job stopped successfully');
  } catch (error) {
    console.error('Failed to stop auto-release job:', error);
  }
  
  server.close(() => {
    console.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
process.on('SIGINT', () => shutdownHandler('SIGINT'));

// Start server with enhanced error handling
const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await new Promise<void>((resolve, reject) => {
      server.listen(PORT, '0.0.0.0', () => {
        console.log({
          timestamp: new Date().toISOString(),
          event: 'server_start',
          mode: process.env.NODE_ENV,
          port: PORT,
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage()
        });
        resolve();
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} is already in use`);
        }
        reject(error);
      });
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
