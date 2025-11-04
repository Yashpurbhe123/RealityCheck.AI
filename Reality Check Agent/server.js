import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import redisTest from "./tests/redis.test.js";
import Routes from "./routes/index.js";
import { sequelizeClient } from "./db_entities/index.js";
import configuration from "./config/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// sync database
sequelizeClient.sync({ alter: true }).then(() => {
  console.log("✅ All tables synced!");
})
  .catch((error) => {
    console.error("❌ Error syncing tables:", error);
  });

// Run tests
redisTest();

// rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// middleware
app.use(limiter);
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3001",
        "http://localhost:5173",
        "https://google-gen-ai-exchange-demo-app.vercel.app/",
        "https://google-gen-ai-exchange-demo-app.vercel.app",
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", Routes);

// health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});

export default app;
