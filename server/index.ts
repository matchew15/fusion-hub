import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { setupAuth } from "./auth";
import escrowRoutes from "./routes/escrow";
import transactionRoutes from "./routes/transactions";
import { autoReleaseJob } from "./jobs/autoRelease";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

(async () => {
  // Setup authentication before routes
  setupAuth(app);
  
  // Register API routes
  app.use('/api/escrow', escrowRoutes);
  app.use('/api/transactions', transactionRoutes);
  registerRoutes(app);
  
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Server error:', err);
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the auto-release job
  autoReleaseJob.start();

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    console.info('SIGTERM signal received: closing HTTP server');
    autoReleaseJob.stop();
    server.close(() => {
      console.info('HTTP server closed');
      process.exit(0);
    });
  });

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    console.log(`${formattedTime} [express] serving on port ${PORT}`);
  });
})();
