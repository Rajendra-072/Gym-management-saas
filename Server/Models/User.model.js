
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["ADMIN", "RECEPTIONIST", "MEMBER"],
      default: "MEMBER",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profilePhoto: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Same email can exist in different gyms,
// but must be unique inside one gym.
userSchema.index({ gymId: 1, email: 1 }, { unique: true });
const User = mongoose.model("User", userSchema);

module.exports = User;