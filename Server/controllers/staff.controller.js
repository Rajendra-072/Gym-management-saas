
const User = require("../Models/User.model");
const bcrypt = require("bcryptjs");

// ==========================================
// HELPER: VALIDATE STAFF ID
// ==========================================

const getStaffById = async (id, gymId) => {
  return User.findOne({
    _id: id,
    gymId,
    role: "RECEPTIONIST",
  });
};

// ==========================================
// 1. CREATE RECEPTIONIST
// ==========================================

const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const gymId = req.user.gymId;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      gymId,
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this gym",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await User.create({
      gymId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "RECEPTIONIST",
    });

    return res.status(201).json({
      success: true,
      message: "Receptionist created successfully",
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    console.error("Create Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create staff",
      error: error.message,
    });
  }
};

// ==========================================
// 2. GET ALL STAFF
// ==========================================

const getAllStaff = async (req, res) => {
  try {
    const gymId = req.user.gymId;

    const {
      search = "",
      status = "ALL",
      page = 1,
      limit = 10,
    } = req.query;

    if (!["ALL", "ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff status",
      });
    }

    const currentPage = Number(page);
    const pageLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isInteger(pageLimit) ||
      pageLimit < 1 ||
      pageLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values",
      });
    }

    const filter = {
      gymId,
      role: "RECEPTIONIST",
    };

    if (status === "ACTIVE") {
      filter.isActive = true;
    }

    if (status === "INACTIVE") {
      filter.isActive = false;
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;

    const [staff, totalRecords, activeCount, inactiveCount] =
      await Promise.all([
        User.find(filter)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageLimit),

        User.countDocuments(filter),

        User.countDocuments({
          gymId,
          role: "RECEPTIONIST",
          isActive: true,
        }),

        User.countDocuments({
          gymId,
          role: "RECEPTIONIST",
          isActive: false,
        }),
      ]);

    const totalPages = Math.ceil(totalRecords / pageLimit);

    return res.status(200).json({
      success: true,
      summary: {
        totalStaff: activeCount + inactiveCount,
        activeStaff: activeCount,
        inactiveStaff: inactiveCount,
      },
      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
      staff,
    });
  } catch (error) {
    console.error("Get Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
      error: error.message,
    });
  }
};

// ==========================================
// 3. GET STAFF BY ID
// ==========================================

const getStaffByIdController = async (req, res) => {
  try {
    const staff = await getStaffById(
      req.params.id,
      req.user.gymId
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Staff By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
      error: error.message,
    });
  }
};

// ==========================================
// 4. UPDATE STAFF DETAILS
// ==========================================

const updateStaff = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const staff = await getStaffById(
      req.params.id,
      req.user.gymId
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (
      name === undefined &&
      email === undefined &&
      phone === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff name",
        });
      }
      staff.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        gymId: req.user.gymId,
        email: normalizedEmail,
        _id: { $ne: staff._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists in this gym",
        });
      }

      staff.email = normalizedEmail;
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number",
        });
      }
      staff.phone = phone.trim();
    }

    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Update Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update staff",
      error: error.message,
    });
  }
};

// ==========================================
// 5. ACTIVATE / DEACTIVATE STAFF
// ==========================================

const updateStaffStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const staff = await getStaffById(
      req.params.id,
      req.user.gymId
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    staff.isActive = isActive;
    await staff.save();

    return res.status(200).json({
      success: true,
      message: `Staff ${isActive ? "activated" : "deactivated"} successfully`,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Update Staff Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update staff status",
      error: error.message,
    });
  }
};

// ==========================================
// 6. RESET STAFF PASSWORD
// ==========================================

const resetStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const staff = await getStaffById(
      req.params.id,
      req.user.gymId
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    staff.password = await bcrypt.hash(newPassword, 12);
    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff password reset successfully",
    });
  } catch (error) {
    console.error("Reset Staff Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset staff password",
      error: error.message,
    });
  }
};

// ==========================================
// 7. DELETE STAFF
// ==========================================

const deleteStaff = async (req, res) => {
  try {
    const staff = await getStaffById(
      req.params.id,
      req.user.gymId
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    await User.deleteOne({
      _id: staff._id,
      gymId: req.user.gymId,
      role: "RECEPTIONIST",
    });

    return res.status(200).json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Delete Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete staff",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================

module.exports = {
  createStaff,
  getAllStaff,
  getStaffByIdController,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword,
  deleteStaff,
};
