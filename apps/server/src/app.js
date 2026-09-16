import express from "express";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";

const app = express();

app.use(express.json());
app.use("/api/courses", courseRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRoutes);

export default app;