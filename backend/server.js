const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const caseRouter = require("./routes/caseRoutes");
const taskRouter = require("./routes/taskRoutes");
const clientRouter = require("./routes/clientRoutes");
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

//configure our node env
dotenv.config({ path: "./config.env" });

const app = express();
app.use(express.json());
// connection to mongoose - MONGODB ATLAS
// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );
// mongoose.connect(DB, {}).then(() => {
//   console.log("Cloud Database connected");
// });

// connection to mongoose - MONGODB LOCAL DATABASE
mongoose
  .connect(process.env.DATABASE_LOCAL, { autoIndex: true })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

console.log(app.get("env"));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// console.log(process.env);
//routes mounting
app.use("/api/v1/users", userRouter);
app.use("/api/v1/cases", caseRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/clients", clientRouter);

//handles non-existing route
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));

  // res.status(404).json({
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // console.log(req.originalUrl);

  next(`Can't find ${req.originalUrl} on this server`);
});

app.use(errorController);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server connected on ${PORT}`);
});

//ALL PROMISE REJECTION
//UNHANDLED REJECTION ERROR: e.g. where BD is down
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  //to shut down out application due to the DB error
  console.log("UNHANDLED REJECTION! Shutting down...");

  server.close(() => {
    process.exit(1);
  });
});
