import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import lookupRoutes from "./routes/lookup.routes.js";
import studentRoutes from "./routes/student.routes.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
const app = express();
app.disable("x-powered-by");
app.use(cors({
  origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((origin) => origin.trim()),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "2mb" }));
app.get("/health", (req, res) => res.json({ status: "ok", service: "UniVerse UOV Backend" }));
app.use("/api/users", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/ma", dashboardRoutes);
app.use("/api/ma/academic", academicRoutes);
app.use("/api/ma/lookups", lookupRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
