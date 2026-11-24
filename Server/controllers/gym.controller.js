
const Gym = require("../Models/Gym.model");

// GET LOGGED-IN GYM PROFILE
const getMyGym = async (req, res) => {
  try {
    const gym = await Gym.findOne({
      _id: req.user.gymId,
      isActive: true,
    });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    return res.status(200).json({
      success: true,
      gym,
    });
  } catch (error) {
    console.error("Get gym profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch gym profile.",
    });
  }
};

// UPDATE GYM PROFILE (ADMIN ONLY)
const updateGymProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      description,
      address,
      openingTime,
      closingTime,
      logo,
    } = req.body;

    // Only allow specific fields to be updated
    const allowedUpdates = {};

    if (name !== undefined) allowedUpdates.name = name.trim();
    if (email !== undefined) allowedUpdates.email = email.trim().toLowerCase();
    if (phone !== undefined) allowedUpdates.phone = phone.trim();
    if (description !== undefined) allowedUpdates.description = description;
    if (openingTime !== undefined) allowedUpdates.openingTime = openingTime;
    if (closingTime !== undefined) allowedUpdates.closingTime = closingTime;
    if (logo !== undefined) allowedUpdates.logo = logo;

    // Safely update address fields
    if (address !== undefined) {
      allowedUpdates.address = {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
      };
    }

    const gym = await Gym.findOneAndUpdate(
      {
        _id: req.user.gymId,
        isActive: true,
      },
      { $set: allowedUpdates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gym profile updated successfully.",
      gym,
    });
  } catch (error) {
    console.error("Update gym profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update gym profile.",
    });
  }
};

// PUBLIC GYM PROFILE (VISITOR)
const getPublicGym = async (req, res) => {
  try {
    const gym = await Gym.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select(
      "name slug email phone description address logo openingTime closingTime"
    );

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found.",
      });
    }

    return res.status(200).json({
      success: true,
      gym,
    });
  } catch (error) {
    console.error("Get public gym error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch gym information.",
    });
  }
};

module.exports = {
  getMyGym,
  updateGymProfile,
  getPublicGym,
};
