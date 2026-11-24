
const Gym = require("../Models/Gym.model");
const User = require("../Models/User.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      gymId: user.gymId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// REGISTER GYM + ADMIN
const registerGym = async (req, res) => {
  let createdGym = null;

  try {
    const { gymName, ownerName, email, password, phone } = req.body;

    if (!gymName || !ownerName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Gym name, owner name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const baseSlug = gymName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid gym name.",
      });
    }

    const slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;

    const hashedPassword = await bcrypt.hash(password, 12);

    createdGym = await Gym.create({
      name: gymName.trim(),
      slug,
      phone: phone || "",
    });

    const admin = await User.create({
      gymId: createdGym._id,
      name: ownerName.trim(),
      email: normalizedEmail,
      phone: phone || "",
      password: hashedPassword,
      role: "ADMIN",
    });

    const token = createToken(admin);
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Gym registered successfully!",
      gym: {
        id: createdGym._id,
        name: createdGym.name,
        slug: createdGym.slug,
      },
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    if (createdGym) {
      await User.deleteMany({ gymId: createdGym._id }).catch(() => {});
      await Gym.findByIdAndDelete(createdGym._id).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered in this gym.",
      });
    }

    console.error("Gym registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register gym.",
    });
  }
};

// LOGIN

const login = async (req, res) => {
  try {
    const { email, password, gymSlug } = req.body;

    if (!email || !password || !gymSlug) {
      return res.status(400).json({
        success: false,
        message: "Email, password and gym slug are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedSlug = gymSlug.trim().toLowerCase();

    // Identify the gym first
    const gym = await Gym.findOne({
      slug: normalizedSlug,
      isActive: true,
    });

    if (!gym) {
      return res.status(401).json({
        success: false,
        message: "Invalid gym or login credentials.",
      });
    }

    // Find user only inside this gym
    const user = await User.findOne({
      gymId: gym._id,
      email: normalizedEmail,
      isActive: true,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user);
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId,
      },
      gym: {
        id: gym._id,
        name: gym.name,
        slug: gym.slug,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
};

// LOGOUT
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

// CURRENT LOGGED-IN USER
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive.",
      });
    }

    const gym = await Gym.findOne({
      _id: req.user.gymId,
      isActive: true,
    });

    if (!gym) {
      return res.status(401).json({
        success: false,
        message: "Gym not found or inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId,
      },
      gym: {
        id: gym._id,
        name: gym.name,
        slug: gym.slug,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch current user.",
    });
  }
};

module.exports = {
  registerGym,
  login,
  logout,
  getMe,
};
