import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { setupAuth } from "./auth";
import escrowRoutes from "./routes/escrow";
import transactionRoutes from "./routes/transactions";
import notificationRoutes from "./routes/notifications";
import { autoReleaseJob } from "./jobs/autoRelease";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper function to find an available port
const findAvailablePort = async (startPort: number, maxAttempts: number = 10): Promise<number> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = startPort + attempt;
    try {
      await new Promise((resolve, reject) => {
        const tempServer = createServer();
        tempServer.listen(port, "0.0.0.0");
        tempServer.on("error", reject);
        tempServer.on("listening", () => {
          tempServer.close(() => resolve(port));
        });
      });
      return port;
    } catch (error: any) {
      if (error.code !== "EADDRINUSE") throw error;
      console.log(`Port ${port} in use, trying next port...`);
    }
  }
  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
};

(async () => {
  try {
    // Setup authentication before routes
    setupAuth(app);
    
    // Register API routes
    app.use('/api/escrow', escrowRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/notifications', notificationRoutes);
    registerRoutes(app);
    
    const server = createServer(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Server error:', err);
      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });

    // Setup static file serving or development server
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the auto-release job
    autoReleaseJob.start();

    // Graceful shutdown handler
    const shutdownHandler = (signal: string) => {
      console.info(`${signal} signal received: closing HTTP server`);
      autoReleaseJob.stop();
      
      server.close(() => {
        console.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));

    // Find available port and start server
    const PORT = await findAvailablePort(5000);
    server.listen(PORT, "0.0.0.0", () => {
      const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      console.log(`${formattedTime} [express] Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
