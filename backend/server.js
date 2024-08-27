const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/userRoutes");
const caseRouter = require("./routes/caseRoutes");
const taskRouter = require("./routes/taskRoutes");
const reportRouter = require("./routes/caseReportRoute");
const leaveRouter = require("./routes/leaveRoutes");
const invoiceRouter = require("./routes/invoiceRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const fileRouter = require("./routes/fileRoutes");
const todoRoutes = require("./routes/todoRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRouter = require("./routes/notificationRoutes");
const googleApiRouter = require("./routes/googleApiRoutes");
const contactRouter = require("./routes/contactRoutes");
const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");

/**
 * //UNCAUGHT EXCEPTIONS: all errors/bugs that
 *  occur in a synchronous code and not handled
 * anywhere in the app
 */
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT ERROR 🔥. Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Configure environment variables
dotenv.config({ path: "./config.env" });

// MIDDLEWARES
const app = express();

app.set("trust proxy", true);

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://case-master-app.vercel.app"],
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  })
);

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(
  express.json({
    limit: "10kb",
  })
);

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Set up Pug as the view engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiter
const limiter = rateLimit({
  max: 200, // allows 200 req from same IP in 1hr
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});
app.use("/api", limiter);

// Cookie parser
app.use(cookieParser());

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/google", googleApiRouter);
app.use("/api/v1/cases", caseRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/leaves", leaveRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/documents", fileRouter);
app.use("/api/v1/todos", todoRoutes);
app.use("/api/v1/contacts", contactRouter);
app.use("/api/v1/events", eventRoutes);

// Handle 404 errors
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

// Determine the environment
const isProduction = process.env.NODE_ENV === "production";

// Connection string for MongoDB Atlas (production)
const DB_PROD = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// Connection string for local MongoDB (development)
const DB_DEV = process.env.DATABASE_LOCAL;

// Choose the appropriate database connection string
const DB = isProduction ? DB_PROD : DB_DEV;

// Connect to the chosen database
mongoose
  .connect(DB, {})
  .then(() => {
    console.log(
      `Database connected (${isProduction ? "production" : "development"})`
    );
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server connected on ${PORT}`);
});

// ALL PROMISE REJECTION
// UNHANDLED REJECTION ERROR: e.g. where DB is down
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down...");
  process.exit(1);
});
