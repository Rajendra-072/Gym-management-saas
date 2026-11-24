
const Membership = require("../Models/Membership.model");
const Member = require("../Models/Member.model");
const MembershipPlan = require("../Models/MembershipPlan.model");

// Calculate membership expiry date
const calculateEndDate = (startDate, duration, durationType) => {
  const endDate = new Date(startDate);

  if (durationType === "DAYS") {
    endDate.setDate(endDate.getDate() + duration);
  } else if (durationType === "MONTHS") {
    endDate.setMonth(endDate.getMonth() + duration);
  } else if (durationType === "YEARS") {
    endDate.setFullYear(endDate.getFullYear() + duration);
  }

  return endDate;
};

// 1. Assign Membership
const assignMembership = async (req, res) => {
  try {
    const { memberId, planId, startDate, notes } = req.body;

    if (!memberId || !planId) {
      return res.status(400).json({
        success: false,
        message: "Member ID and Plan ID are required",
      });
    }

    // Find member in logged-in gym
    const member = await Member.findOne({
      _id: memberId,
      gymId: req.user.gymId,
      isActive: true,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Active member not found",
      });
    }

    // Find active plan in same gym
    const plan = await MembershipPlan.findOne({
      _id: planId,
      gymId: req.user.gymId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Active membership plan not found",
      });
    }

    // Check existing active membership
    const existingMembership = await Membership.findOne({
      memberId,
      gymId: req.user.gymId,
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: "Member already has an active membership. Renew it instead.",
      });
    }

    const membershipStartDate = startDate
      ? new Date(startDate)
      : new Date();

    if (Number.isNaN(membershipStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    const endDate = calculateEndDate(
      membershipStartDate,
      plan.duration,
      plan.durationType
    );

    const membership = await Membership.create({
      gymId: req.user.gymId,
      memberId,
      planId,
      planName: plan.name,
      planPrice: plan.price,
      duration: plan.duration,
      durationType: plan.durationType,
      startDate: membershipStartDate,
      endDate,
      status: "ACTIVE",
      assignedBy: req.user.userId,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Membership assigned successfully",
      membership,
    });
  } catch (error) {
    console.error("Assign membership error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign membership",
    });
  }
};

// 2. Get All Memberships
const getMemberships = async (req, res) => {
  try {
    const { status, memberId } = req.query;

    const filter = {
      gymId: req.user.gymId,
    };

    if (status) {
      if (!["ACTIVE", "EXPIRED", "CANCELLED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid membership status",
        });
      }

      filter.status = status;
    }

    if (memberId) {
      filter.memberId = memberId;
    }

    const memberships = await Membership.find(filter)
      .populate("memberId", "name phone memberCode")
      .populate("planId", "name duration durationType price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: memberships.length,
      memberships,
    });
  } catch (error) {
    console.error("Get memberships error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch memberships",
    });
  }
};

// 3. Get Membership by ID
const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      gymId: req.user.gymId,
    })
      .populate("memberId", "name phone memberCode")
      .populate("planId", "name duration durationType price");

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    return res.status(200).json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error("Get membership error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch membership",
    });
  }
};

// 4. Cancel Membership
const cancelMembership = async (req, res) => {
  try {
    const membership = await Membership.findOneAndUpdate(
      {
        _id: req.params.id,
        gymId: req.user.gymId,
        status: "ACTIVE",
      },
      {
        status: "CANCELLED",
      },
      {
        new: true,
      }
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Active membership not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership cancelled successfully",
      membership,
    });
  } catch (error) {
    console.error("Cancel membership error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel membership",
    });
  }
};

// 5. Renew Membership
const renewMembership = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    const oldMembership = await Membership.findOne({
      _id: req.params.id,
      gymId: req.user.gymId,
    });

    if (!oldMembership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    if (oldMembership.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled membership cannot be renewed",
      });
    }

    if (oldMembership.status === "ACTIVE" &&
        oldMembership.endDate > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Membership is still active",
      });
    }

    const member = await Member.findOne({
      _id: oldMembership.memberId,
      gymId: req.user.gymId,
      isActive: true,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Active member not found",
      });
    }

    const plan = await MembershipPlan.findOne({
      _id: planId,
      gymId: req.user.gymId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Active membership plan not found",
      });
    }

    const startDate = new Date();

    const endDate = calculateEndDate(
      startDate,
      plan.duration,
      plan.durationType
    );

    // Preserve old membership history
    oldMembership.status = "EXPIRED";
    await oldMembership.save();

    const newMembership = await Membership.create({
      gymId: req.user.gymId,
      memberId: oldMembership.memberId,
      planId,
      planName: plan.name,
      planPrice: plan.price,
      duration: plan.duration,
      durationType: plan.durationType,
      startDate,
      endDate,
      status: "ACTIVE",
      assignedBy: req.user.userId,
      notes: "Renewed membership",
    });

    return res.status(201).json({
      success: true,
      message: "Membership renewed successfully",
      membership: newMembership,
    });
  } catch (error) {
    console.error("Renew membership error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to renew membership",
    });
  }
};

module.exports = {
  assignMembership,
  getMemberships,
  getMembershipById,
  cancelMembership,
  renewMembership,
};
