import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { processStripeWebhook, verifyStripeSignature } from "../webhooks/stripe";
import * as db from "../db";
import { startCronService, triggerNotificationProcessing } from "../services/cronService";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
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
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Stripe webhook endpoint
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    
    try {
      // Get webhook secret from app settings
      const webhookSecretSetting = await db.getAppSetting('stripe_webhook_secret');
      const webhookSecret = webhookSecretSetting?.value || '';
      
      if (!webhookSecret) {
        console.warn('[Stripe Webhook] No webhook secret configured');
        res.status(400).json({ error: 'Webhook not configured' });
        return;
      }
      
      // Verify signature
      const isValid = await verifyStripeSignature(
        req.body.toString(),
        signature,
        webhookSecret
      );
      
      if (!isValid) {
        console.warn('[Stripe Webhook] Invalid signature');
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
      
      // Parse and process the event
      const event = JSON.parse(req.body.toString());
      const result = await processStripeWebhook(event);
      
      if (result.success) {
        res.json({ received: true, message: result.message });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    
    // Start cron service for scheduled notifications
    startCronService();
  });

  // Manual trigger endpoint for processing notifications (admin only)
  app.post("/api/admin/process-notifications", async (req, res) => {
    try {
      const result = await triggerNotificationProcessing();
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[Admin] Error processing notifications:', error);
      res.status(500).json({ error: 'Failed to process notifications' });
    }
  });
}

startServer().catch(console.error);
