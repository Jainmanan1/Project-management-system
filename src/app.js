import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

//using cors middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import healthcheckRoutes from "./routes/healthcheck.route.js";
import authRouter from "./routes/auth.route.js"
app.use("/api/v1/healthcheck",  healthcheckRoutes);
app.use("/api/v1/auth",authRouter)



app.get("/",  (req, res) => {
  res.send("server has been started");
});

export default app;
