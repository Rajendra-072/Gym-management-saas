
const mongoose = require("mongoose");

const gymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    logo: {
      type: String,
      default: "",
    },

    openingTime: {
      type: String,
      default: "06:00",
    },

    closingTime: {
      type: String,
      default: "22:00",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Gym = mongoose.model("Gym", gymSchema);

module.exports = Gym;
