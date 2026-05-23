const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("REGISTER BODY:", req.body);

    // validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // check existing user
    const existingUser = await User.findOne({ email });
    console.log("EXISTING USER:", existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("HASHED PASSWORD:", hashedPassword);

    // create user
    const user = await User.create({
      email: email.trim(),
      password: hashedPassword,
    });

    console.log("USER CREATED:", user);

    // create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    // validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // find user
    const user = await User.findOne({ email: email.trim() });
    console.log("DB USER:", user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};