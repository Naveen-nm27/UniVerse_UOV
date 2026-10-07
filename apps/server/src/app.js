import express from "express";
import userRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import lecturerRoutes from "./routes/lecturer.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(
  "/api/student",
  studentRoutes
);

app.use("/api/lecturer", lecturerRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);

export default app;
