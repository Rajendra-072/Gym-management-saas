
const MembershipPlan = require("../Models/MembershipPlan.model");
const Gym = require("../Models/Gym.model");

// 1. Create Membership Plan
const createMembershipPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      durationType,
      price,
      features,
      sortOrder,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required",
      });
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      !["DAYS", "MONTHS", "YEARS"].includes(durationType || "MONTHS")
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid duration and durationType are required",
      });
    }

    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid plan price is required",
      });
    }

    if (features !== undefined && !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        message: "Features must be an array",
      });
    }

    const plan = await MembershipPlan.create({
      gymId: req.user.gymId,
      name: name.trim(),
      description: description || "",
      duration,
      durationType: durationType || "MONTHS",
      price,
      features: features || [],
      sortOrder: sortOrder ?? 0,
    });

    return res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create membership plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create membership plan",
    });
  }
};

// 2. Get Logged-in Gym Plans
const getMembershipPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({
      gymId: req.user.gymId,
    }).sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Get membership plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch membership plans",
    });
  }
};

// 3. Get Public Gym Plans
const getPublicMembershipPlans = async (req, res) => {
  try {
    const gym = await Gym.findOne({
      slug: req.params.slug,
      isActive: true,
    }).select("_id");

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym not found",
      });
    }

    const plans = await MembershipPlan.find({
      gymId: gym._id,
      isActive: true,
    })
      .select("-gymId")
      .sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Get public membership plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch public membership plans",
    });
  }
};

// 4. Update Membership Plan
const updateMembershipPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      durationType,
      price,
      features,
      sortOrder,
    } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan name cannot be empty",
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (duration !== undefined) {
      if (!Number.isInteger(duration) || duration < 1) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a positive integer",
        });
      }
      updates.duration = duration;
    }

    if (durationType !== undefined) {
      if (!["DAYS", "MONTHS", "YEARS"].includes(durationType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid duration type",
        });
      }
      updates.durationType = durationType;
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number",
        });
      }
      updates.price = price;
    }

    if (features !== undefined) {
      if (!Array.isArray(features)) {
        return res.status(400).json({
          success: false,
          message: "Features must be an array",
        });
      }
      updates.features = features;
    }

    if (sortOrder !== undefined) {
      updates.sortOrder = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const plan = await MembershipPlan.findOneAndUpdate(
      {
        _id: req.params.id,
        gymId: req.user.gymId,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update membership plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update membership plan",
    });
  }
};

// 5. Activate / Deactivate Plan
const updateMembershipPlanStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const plan = await MembershipPlan.findOneAndUpdate(
      {
        _id: req.params.id,
        gymId: req.user.gymId,
      },
      { $set: { isActive } },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership plan status updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update membership plan status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update membership plan status",
    });
  }
};

// 6. Delete Membership Plan
const deleteMembershipPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findOneAndDelete({
      _id: req.params.id,
      gymId: req.user.gymId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete membership plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete membership plan",
    });
  }
};

module.exports = {
  createMembershipPlan,
  getMembershipPlans,
  getPublicMembershipPlans,
  updateMembershipPlan,
  updateMembershipPlanStatus,
  deleteMembershipPlan,
};
