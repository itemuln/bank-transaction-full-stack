// =============================================================================
// Express Server Entry Point — Production-grade banking API
// =============================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { rateLimit } from "./middleware/rate-limit.middleware";

// Route imports
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import transactionRoutes from "./routes/transaction.routes";
import adminRoutes from "./routes/admin.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────

// Helmet sets various HTTP headers for security
app.use(helmet());

// CORS — only allow frontend origin
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies (limit to 10KB to prevent abuse)
app.use(express.json({ limit: "10kb" }));

// Parse cookies for httpOnly token storage
app.use(cookieParser());

// Global rate limiter
app.use(rateLimit(env.RATE_LIMIT_MAX_REQUESTS, env.RATE_LIMIT_WINDOW_MS));

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// ── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ── Error Handler (must be last) ─────────────────────────────────────────────

app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  console.log(`🏦 Banking API running on port ${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
});

export default app;
