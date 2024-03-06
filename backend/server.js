const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const morgan = require("morgan");

//configure our node env
// dotenv.config({ path: "./.env" });
const app = express();

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
  .connect(process.env.DATABASE_LOCAL, {})
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => console.log(err));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Testing");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server connected on ${PORT}`);
});
