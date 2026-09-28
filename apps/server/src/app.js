import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

dotenv.config();

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================
   Body parsers
========================= */

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/* =========================
   Health check
========================= */

app.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      status: "ok",
      service: "UniVerse UOV Backend",
      timestamp:
        new Date().toISOString(),
    });
  }
);

/* =========================
   API routes
========================= */

/*
 * Temporary legacy authentication route.
 *
 * The README eventually expects:
 *
 * POST /api/auth/login
 *
 * For now:
 *
 * POST /api/users/login
 */
app.use(
  "/api/users",
  userRoutes
);

/*
 * Management Assistant routes.
 */
app.use(
  "/api/ma",
  dashboardRoutes
);

/* =========================
   404
========================= */

app.use(notFound);

/* =========================
   Error handler
========================= */

app.use(errorHandler);

export default app;