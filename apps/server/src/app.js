import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import lookupRoutes from "./routes/lookup.routes.js";

import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

dotenv.config();

const app = express();

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

app.use(express.json({ limit: "2mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "UniVerse UOV Backend",
    timestamp: new Date().toISOString(),
  });
});


app.use("/api/users", userRoutes);


app.use("/api/ma", dashboardRoutes);
app.use("/api/ma/academic", academicRoutes);
app.use("/api/ma/lookups", lookupRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;