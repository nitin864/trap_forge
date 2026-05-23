const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const authRoutes = require("./routes/authRoutes");

const app = express();

// DB CONNECT
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// MIDDLEWARE
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);

app.listen(5000, () => console.log("Server running on 5000"));