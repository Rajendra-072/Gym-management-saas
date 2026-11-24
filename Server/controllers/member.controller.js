
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const Member = require("../Models/Member.model");
// const User = require("../Models/User.model");

// // ==========================================
// // 1. CREATE MEMBER
// // ==========================================

// const createMember = async (req, res) => {
//   try {
//     const {
//       name,
//       phone,
//       email,
//       gender,
//       dateOfBirth,
//       address,
//       emergencyContact,
//     } = req.body;

//     if (!name?.trim() || !phone?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Name and phone are required",
//       });
//     }

//     const memberCode = `MEM-${Date.now()}-${Math.floor(
//       Math.random() * 1000
//     )}`;

//     const member = await Member.create({
//       gymId: req.user.gymId,
//       memberCode,
//       name: name.trim(),
//       phone: phone.trim(),
//       email: email?.trim().toLowerCase(),
//       gender,
//       dateOfBirth,
//       address,
//       emergencyContact,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Member registered successfully",
//       member,
//     });
//   } catch (error) {
//     console.error("Create Member Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to register member",
//       error: error.message,
//     });
//   }
// };

// // ==========================================
// // 2. GET ALL MEMBERS + SEARCH + FILTER
// // ==========================================

// const getMembers = async (req, res) => {
//   try {
//     const {
//       search = "",
//       status = "ALL",
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const gymId = req.user.gymId;

//     if (!["ALL", "ACTIVE", "INACTIVE"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid member status",
//       });
//     }

//     const currentPage = Number(page);
//     const pageLimit = Number(limit);

//     if (
//       !Number.isInteger(currentPage) ||
//       currentPage < 1 ||
//       !Number.isInteger(pageLimit) ||
//       pageLimit < 1 ||
//       pageLimit > 100
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid pagination values",
//       });
//     }

//     const filter = { gymId };

//     if (status === "ACTIVE") {
//       filter.isActive = true;
//     }

//     if (status === "INACTIVE") {
//       filter.isActive = false;
//     }

//     if (search.trim()) {
//       const safeSearch = search.trim().replace(
//         /[.*+?^${}()|[\]\\]/g,
//         "\\$&"
//       );

//       filter.$or = [
//         { name: { $regex: safeSearch, $options: "i" } },
//         { phone: { $regex: safeSearch, $options: "i" } },
//         { memberCode: { $regex: safeSearch, $options: "i" } },
//         { email: { $regex: safeSearch, $options: "i" } },
//       ];
//     }

//     const skip = (currentPage - 1) * pageLimit;

//     const [
//       members,
//       totalRecords,
//       activeCount,
//       inactiveCount,
//     ] = await Promise.all([
//       Member.find(filter)
//         .select("-__v")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(pageLimit),

//       Member.countDocuments(filter),

//       Member.countDocuments({
//         gymId,
//         isActive: true,
//       }),

//       Member.countDocuments({
//         gymId,
//         isActive: false,
//       }),
//     ]);

//     const totalPages = Math.ceil(totalRecords / pageLimit);

//     return res.status(200).json({
//       success: true,

//       summary: {
//         totalMembers: activeCount + inactiveCount,
//         activeMembers: activeCount,
//         inactiveMembers: inactiveCount,
//       },

//       pagination: {
//         currentPage,
//         limit: pageLimit,
//         totalRecords,
//         totalPages,
//         hasNextPage: currentPage < totalPages,
//         hasPreviousPage: currentPage > 1,
//       },

//       members,
//     });
//   } catch (error) {
//     console.error("Get Members Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch members",
//       error: error.message,
//     });
//   }
// };

// // ==========================================
// // 3. GET SINGLE MEMBER
// // ==========================================

// const getMemberById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid member ID",
//       });
//     }

//     const member = await Member.findOne({
//       _id: id,
//       gymId: req.user.gymId,
//     }).select("-__v");

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       member,
//     });
//   } catch (error) {
//     console.error("Get Member Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch member",
//       error: error.message,
//     });
//   }
// };

// // ==========================================
// // 4. UPDATE MEMBER
// // ==========================================

// const updateMember = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid member ID",
//       });
//     }

//     const allowedFields = [
//       "name",
//       "phone",
//       "email",
//       "gender",
//       "dateOfBirth",
//       "address",
//       "emergencyContact",
//       "profilePhoto",
//     ];

//     const updateData = {};

//     for (const field of allowedFields) {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     }

//     if (Object.keys(updateData).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided for update",
//       });
//     }

//     if (
//       updateData.name !== undefined &&
//       (typeof updateData.name !== "string" ||
//         !updateData.name.trim())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid member name",
//       });
//     }

//     if (
//       updateData.phone !== undefined &&
//       (typeof updateData.phone !== "string" ||
//         !updateData.phone.trim())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid phone number",
//       });
//     }

//     if (updateData.email !== undefined) {
//       if (
//         typeof updateData.email !== "string" ||
//         !updateData.email.trim()
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid email",
//         });
//       }

//       updateData.email = updateData.email.trim().toLowerCase();
//     }

//     if (updateData.name !== undefined) {
//       updateData.name = updateData.name.trim();
//     }

//     if (updateData.phone !== undefined) {
//       updateData.phone = updateData.phone.trim();
//     }

//     const member = await Member.findOneAndUpdate(
//       {
//         _id: id,
//         gymId: req.user.gymId,
//       },
//       updateData,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Member updated successfully",
//       member,
//     });
//   } catch (error) {
//     console.error("Update Member Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update member",
//       error: error.message,
//     });
//   }
// };

// // ==========================================
// // 5. ACTIVATE / DEACTIVATE MEMBER
// // ==========================================

// const updateMemberStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isActive } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid member ID",
//       });
//     }

//     if (typeof isActive !== "boolean") {
//       return res.status(400).json({
//         success: false,
//         message: "isActive must be true or false",
//       });
//     }

//     const member = await Member.findOneAndUpdate(
//       {
//         _id: id,
//         gymId: req.user.gymId,
//       },
//       { isActive },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Member not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Member ${
//         isActive ? "activated" : "deactivated"
//       } successfully`,
//       member,
//     });
//   } catch (error) {
//     console.error("Update Member Status Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update member status",
//       error: error.message,
//     });
//   }
// };

// // ==========================================
// // 6. CREATE MEMBER LOGIN ACCOUNT
// // ==========================================

// const createMemberAccount = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { password } = req.body;

//     const gymId = req.user.gymId;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid member ID",
//       });
//     }

//     if (!password || password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters",
//       });
//     }

//     const member = await Member.findOne({
//       _id: id,
//       gymId,
//       isActive: true,
//     });

//     if (!member) {
//       return res.status(404).json({
//         success: false,
//         message: "Active member not found",
//       });
//     }

//     if (!member.email) {
//       return res.status(400).json({
//         success: false,
//         message: "Member email is required",
//       });
//     }

//     if (member.userId) {
//       return res.status(409).json({
//         success: false,
//         message: "Member account already exists",
//       });
//     }

//     const normalizedEmail = member.email.trim().toLowerCase();

//     const existingUser = await User.findOne({
//       gymId,
//       email: normalizedEmail,
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: "An account with this email already exists",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);

//     const user = await User.create({
//       gymId,
//       name: member.name,
//       email: normalizedEmail,
//       phone: member.phone,
//       password: hashedPassword,
//       role: "MEMBER",
//     });

//     member.userId = user._id;
//     await member.save();

//     return res.status(201).json({
//       success: true,
//       message: "Member login account created successfully",
//       account: {
//         userId: user._id,
//         memberId: member._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Create Member Account Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create member account",
//       error: error.message,
//     });
//   }
// };

// // ==========================================
// // EXPORT ALL CONTROLLERS
// // ==========================================

// module.exports = {
//   createMember,
//   getMembers,
//   getMemberById,
//   updateMember,
//   updateMemberStatus,
//   createMemberAccount,
// };



const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Member = require("../Models/Member.model");
const User = require("../Models/User.model");
const Membership = require("../Models/Membership.model");
const Attendance = require("../Models/Attendance.model");
const MembershipPlan = require("../Models/MembershipPlan.model");
const Facility = require("../Models/Facility.model");

// Helper: validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: escape regex input
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 1. Create Member
const createMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const memberCode = `MEM-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    const member = await Member.create({
      gymId: req.user.gymId,
      memberCode,
      name: name.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone.trim(),
      gender,
      dateOfBirth,
      address,
      emergencyContact,
    });

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get All Members
const getMembers = async (req, res) => {
  try {
    const {
      search = "",
      status = "ALL",
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = { gymId: req.user.gymId };

    if (status === "ACTIVE") filter.isActive = true;
    if (status === "INACTIVE") filter.isActive = false;

    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { memberCode: regex },
      ];
    }

    const [members, total, activeCount, inactiveCount] =
      await Promise.all([
        Member.find(filter)
          .sort({ createdAt: -1 })
          .skip((currentPage - 1) * pageLimit)
          .limit(pageLimit),

        Member.countDocuments(filter),
        Member.countDocuments({
          gymId: req.user.gymId,
          isActive: true,
        }),
        Member.countDocuments({
          gymId: req.user.gymId,
          isActive: false,
        }),
      ]);

    return res.status(200).json({
      success: true,
      members,
      summary: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
      },
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get Member By ID (Admin / Receptionist)
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const member = await Member.findOne({
      _id: id,
      gymId: req.user.gymId,
    }).populate("userId", "name email phone role");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update Member (Admin / Receptionist)
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "gender",
      "dateOfBirth",
      "address",
      "emergencyContact",
      "profilePhoto",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.name !== undefined &&
      (!updates.name || !updates.name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (
      updates.phone !== undefined &&
      (!updates.phone || !updates.phone.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone cannot be empty",
      });
    }

    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();

    if (updates.email !== undefined) {
      updates.email = updates.email?.trim().toLowerCase() || "";
    }

    const member = await Member.findOne({
      _id: id,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    Object.assign(member, updates);
    await member.save();

    // Keep linked login account details in sync
    if (member.userId) {
      const userUpdates = {};

      if (updates.name !== undefined) userUpdates.name = updates.name;
      if (updates.phone !== undefined) userUpdates.phone = updates.phone;
      if (updates.email !== undefined) userUpdates.email = updates.email;

      if (Object.keys(userUpdates).length) {
        const duplicateUser = updates.email
          ? await User.findOne({
              gymId: req.user.gymId,
              email: updates.email,
              _id: { $ne: member.userId },
            })
          : null;

        if (duplicateUser) {
          return res.status(409).json({
            success: false,
            message: "Email already exists for another account",
          });
        }

        await User.findOneAndUpdate(
          {
            _id: member.userId,
            gymId: req.user.gymId,
            role: "MEMBER",
          },
          userUpdates,
          { runValidators: true }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Activate / Deactivate Member
const updateMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const member = await Member.findOne({
      _id: id,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    member.isActive = isActive;
    await member.save();

    // Deactivate/reactivate linked member login account too
    if (member.userId) {
      await User.findOneAndUpdate(
        {
          _id: member.userId,
          gymId: req.user.gymId,
          role: "MEMBER",
        },
        { isActive }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Member ${isActive ? "activated" : "deactivated"} successfully`,
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Create Member Login Account
const createMemberAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const member = await Member.findOne({
      _id: id,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (!member.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot create account for inactive member",
      });
    }

    if (!member.email) {
      return res.status(400).json({
        success: false,
        message: "Member email is required to create login account",
      });
    }

    if (member.userId) {
      return res.status(409).json({
        success: false,
        message: "Member account already exists",
      });
    }

    const existingUser = await User.findOne({
      gymId: req.user.gymId,
      email: member.email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      gymId: req.user.gymId,
      name: member.name,
      email: member.email.toLowerCase(),
      phone: member.phone,
      password: hashedPassword,
      role: "MEMBER",
    });

    try {
      member.userId = user._id;
      await member.save();
    } catch (saveError) {
      await User.deleteOne({ _id: user._id });
      throw saveError;
    }

    return res.status(201).json({
      success: true,
      message: "Member login account created successfully",
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        userId: user._id,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Get Own Member Profile
const getMyMemberProfile = async (req, res) => {
  try {
    const member = await Member.findOne({
      userId: req.user.userId,
      gymId: req.user.gymId,
    }).populate("userId", "name email phone profilePhoto");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Update Own Member Profile
const updateMyMemberProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "phone",
      "address",
      "emergencyContact",
      "profilePhoto",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (updates.phone !== undefined && !updates.phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone cannot be empty",
      });
    }

    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();

    const member = await Member.findOne({
      userId: req.user.userId,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    Object.assign(member, updates);
    await member.save();

    const userUpdates = {};

    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.phone !== undefined) userUpdates.phone = updates.phone;

    if (Object.keys(userUpdates).length) {
      await User.findOneAndUpdate(
        {
          _id: req.user.userId,
          gymId: req.user.gymId,
          role: "MEMBER",
        },
        userUpdates,
        { runValidators: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      member,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 9. Get Own Membership Details
const getMyMembership = async (req, res) => {
  try {
    const member = await Member.findOne({
      userId: req.user.userId,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    const memberships = await Membership.find({
      gymId: req.user.gymId,
      memberId: member._id,
    })
      .populate("planId")
      .sort({ createdAt: -1 });

    const activeMembership = memberships.find(
      (item) =>
        item.status === "ACTIVE" &&
        new Date(item.endDate) >= new Date()
    );

    return res.status(200).json({
      success: true,
      activeMembership: activeMembership || null,
      membershipHistory: memberships,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 10. Get Own Attendance History
const getMyAttendance = async (req, res) => {
  try {
    const member = await Member.findOne({
      userId: req.user.userId,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const filter = {
      gymId: req.user.gymId,
      memberId: member._id,
    };

    const [attendance, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ attendanceDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      attendance,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 11. Member Dashboard Summary
const getMyMemberDashboard = async (req, res) => {
  try {
    const member = await Member.findOne({
      userId: req.user.userId,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member profile not found",
      });
    }

    const now = new Date();

    const [
      activeMembership,
      totalAttendance,
      recentAttendance,
      facilities,
      plans,
    ] = await Promise.all([
      Membership.findOne({
        gymId: req.user.gymId,
        memberId: member._id,
        status: "ACTIVE",
        endDate: { $gte: now },
      }).populate("planId"),

      Attendance.countDocuments({
        gymId: req.user.gymId,
        memberId: member._id,
      }),

      Attendance.find({
        gymId: req.user.gymId,
        memberId: member._id,
      })
        .sort({ attendanceDate: -1 })
        .limit(5),

      Facility.find({
        gymId: req.user.gymId,
        isActive: true,
      }).select("name description imageUrl"),

      MembershipPlan.find({
        gymId: req.user.gymId,
        isActive: true,
      }).select("name duration durationType price features"),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        member,
        activeMembership,
        totalAttendance,
        recentAttendance,
        facilities,
        availablePlans: plans,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  updateMemberStatus,
  createMemberAccount,
  getMyMemberProfile,
  updateMyMemberProfile,
  getMyMembership,
  getMyAttendance,
  getMyMemberDashboard,
};
