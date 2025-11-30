const dotenv = require("dotenv").config({ path: "./config.env" });
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const xss = require("xss-clean");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

// Route imports
const userRouter = require("./routes/userRoutes");
const caseRouter = require("./routes/caseRoutes");
const taskRouter = require("./routes/taskRoutes");
const reportRouter = require("./routes/caseReportRoute");
const leaveRouter = require("./routes/leaveRoutes");
const invoiceRouter = require("./routes/invoiceRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const fileRouter = require("./routes/fileRoutes");
const todoRoutes = require("./routes/todoRoutes");
const eventRouter = require("./routes/eventRoutes");
const notificationRouter = require("./routes/notificationRoutes");
const contactRouter = require("./routes/contactRoutes");
const noteRouter = require("./routes/noteRoutes");
const documentRecordRouter = require("./routes/documentRecordRoute");

const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

/**
 * Handle Unhandled Promise Rejections
 * This prevents the server from crashing
 */
process.on("unhandledRejection", (err, promise) => {
  console.error("🚨 UNHANDLED PROMISE REJECTION:");
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  console.error("Stack Trace:", err.stack);

  // Don't crash the server - just log the error
  if (process.env.NODE_ENV === "development") {
    console.error("Full Error Object:", err);
  }

  // Optionally send alert to monitoring service (Sentry, etc.)
  // sendErrorToMonitoring(err);

  // DON'T EXIT THE PROCESS - Keep server running
  console.log("⚠️ Server continuing to run despite error...");
});

/**
 * Handle Uncaught Exceptions
 */
process.on("uncaughtException", (err) => {
  console.error("🚨 UNCAUGHT EXCEPTION:");
  console.error("Error Name:", err.name);
  console.error("Error Message:", err.message);
  console.error("Stack Trace:", err.stack);

  // For uncaught exceptions, it's safer to restart
  // But we'll try to shut down gracefully
  console.log("⚠️ Attempting graceful shutdown...");

  // Give pending requests time to complete
  setTimeout(() => {
    process.exit(1);
  }, 3000);
});

/**
 * Handle SIGTERM (graceful shutdown)
 */
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  server.close(() => {
    console.log("💥 Process terminated!");
    process.exit(0);
  });
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  console.log("👋 SIGINT RECEIVED. Shutting down gracefully...");
  server.close(() => {
    console.log("💥 Process terminated!");
    process.exit(0);
  });
});

// ============================================
// EXPRESS APP SETUP
// ============================================

// Initialize Express app
const app = express();

// MongoDB configuration
mongoose.set("strictPopulate", false);
mongoose.set("strictQuery", true);

// Enable trust proxy
app.set("trust proxy", 1);

// Security middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://case-master-app.vercel.app",
      process.env.FRONTEND_URL, // Add from environment variable
    ].filter(Boolean), // Remove any undefined values
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsers
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      // Add fields that can have multiple parameters
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Set up Pug as the view engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined")); // More detailed in production
}

// Rate limiter function
// function rateLimiter(windowMs, message, max) {
//   return rateLimit({
//     max: max,
//     windowMs: windowMs,
//     message: message,
//     standardHeaders: true,
//     legacyHeaders: false,
//     trustProxy: true,
//     handler: (req, res, next) => {
//       next(new AppError(message, 429));
//     },
//   });
// }

// Apply rate limiting to sensitive routes
// app.use(
//   "/api/v1/users/login",
//   rateLimiter(
//     15 * 60 * 1000, // 15 minutes
//     "Too many login attempts from this IP, please try again in 15 minutes.",
//     5 // 5 attempts per 15 minutes
//   )
// );

// app.use(
//   "/api/v1/users/resetpassword",
//   rateLimiter(
//     15 * 60 * 1000, // 15 minutes
//     "Too many password reset attempts, please try again in 15 minutes.",
//     3
//   )
// );

// General API rate limiting (more lenient)
// app.use(
//   "/api/v1/",
//   rateLimiter(
//     15 * 60 * 1000, // 15 minutes
//     "Too many requests from this IP, please try again later.",
//     100 // 100 requests per 15 minutes
//   )
// );

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/cases", caseRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/leaves", leaveRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/todos", todoRoutes);
app.use("/api/v1/contacts", contactRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/documentRecord", documentRecordRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Case Master API",
    version: "1.0.0",
    documentation: process.env.API_DOCS_URL || "Not available",
  });
});

// Handle 404 errors - MUST be after all routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Custom error handling middleware for specific errors
app.use((err, req, res, next) => {
  console.error("🔥 Express Error Handler:");
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);

  // Handle specific error types
  if (err.name === "TimeoutError") {
    return res.status(408).json({
      status: "error",
      message:
        "Request timeout. Please try again with a smaller file or check your connection.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      status: "error",
      message: `File upload error: ${err.message}`,
    });
  }

  if (err.message?.includes("Cloudinary")) {
    return res.status(502).json({
      status: "error",
      message:
        "File storage service is temporarily unavailable. Please try again later.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Pass to main error controller
  next(err);
});

// Main error handling middleware (MUST be last)
app.use(errorController);

// ============================================
// DATABASE CONNECTION & SERVER STARTUP
// ============================================

// Determine the environment
const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables
const requiredEnvVars = ["DATABASE", "DATABASE_PASSWORD"];
if (isProduction) {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  });
}

// Database connection strings
const DB_PROD = process.env.DATABASE?.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const DB_DEV =
  process.env.DATABASE_LOCAL || "mongodb://localhost:27017/case-master";

const DB = isProduction ? DB_PROD : DB_DEV;

if (!DB) {
  console.error("❌ No database connection string configured");
  process.exit(1);
}

// Database connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  try {
    await mongoose.connect(DB, {
      serverSelectionTimeoutMS: 60000, //
      connectTimeoutMS: 60000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      retryWrites: true,
      retryReads: true,
    });
    console.log(
      `✅ Database connected (${isProduction ? "production" : "development"})`
    );
  } catch (err) {
    console.error(
      `❌ Database connection failed (attempt ${6 - retries}/5):`,
      err.message
    );

    if (retries > 0) {
      console.log(`🔄 Retrying connection in ${delay / 1000} seconds...`);
      setTimeout(() => connectWithRetry(retries - 1, delay), delay);
    } else {
      console.error("💥 Maximum connection retries reached. Exiting...");
      process.exit(1);
    }
  }
};

// Connect to database
connectWithRetry();

// Server startup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server started successfully!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
📅 Started at: ${new Date().toISOString()}
  `);
});

// Handle server errors
server.on("error", (err) => {
  console.error("❌ Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Export app for testing
module.exports = app;
