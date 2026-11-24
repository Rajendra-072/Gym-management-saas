
const Enquiry = require("../Models/Enquiry.model");
const Gym = require("../Models/Gym.model");
const MembershipPlan = require("../Models/MembershipPlan.model");

// 1. Submit Public Enquiry
const createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, interestedPlan, message } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // Find gym using public slug
    const gym = await Gym.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    // Validate selected plan belongs to this gym
    if (interestedPlan) {
      const plan = await MembershipPlan.findOne({
        _id: interestedPlan,
        gymId: gym._id,
        isActive: true,
      });

      if (!plan) {
        return res.status(400).json({
          success: false,
          message: "Selected membership plan is invalid",
        });
      }
    }

    const enquiry = await Enquiry.create({
      gymId: gym._id,
      name: name.trim(),
      phone: phone.trim(),
      email:
        typeof email === "string"
          ? email.trim().toLowerCase()
          : "",
      interestedPlan: interestedPlan || null,
      message:
        typeof message === "string"
          ? message.trim()
          : "",
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
    });
  }
};

// 2. Get Gym Enquiries
const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      gymId: req.user.gymId,
    })
      .populate("interestedPlan", "name duration durationType price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
};

// 3. Update Enquiry Status
const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "NEW",
      "CONTACTED",
      "CONVERTED",
      "CLOSED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry status",
      });
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      {
        _id: req.params.id,
        gymId: req.user.gymId,
      },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Update enquiry status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update enquiry status",
    });
  }
};

// 4. Delete Enquiry (Admin Only)
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOneAndDelete({
      _id: req.params.id,
      gymId: req.user.gymId,
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("Delete enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete enquiry",
    });
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
};

