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

//configure our node env
dotenv.config({ path: "./.env" });

const app = express();
app.use(express.json());
// connection to mongoose - MONGODB ATLAS
// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );
// mongoose.connect(DB, {}).then(() => {
//   console.log("Database connected");
// });

// connection to mongoose - MONGODB LOCAL DATABASE
mongoose
  .connect(process.env.DATABASE_LOCAL, { autoIndex: true })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => console.log(err));

console.log(app.get("env"));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// console.log(process.env);
//routers mounting
app.use("/api/v1/users", userRouter);
app.use("/api/v1/cases", caseRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/clients", clientRouter);

//handles non-existing route
app.all("*", (res, req, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 400));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server connected on ${PORT}`);
});

app.use(errorController);
