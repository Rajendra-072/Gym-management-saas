
const Attendance = require("../Models/Attendance.model");
const Member = require("../Models/Member.model");

// Get start and end of a date (server local timezone)
const getDateRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

// 1. Member Check-in
const checkInMember = async (req, res) => {
  try {
    const { memberId, notes } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required",
      });
    }

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

    const now = new Date();
    const range = getDateRange(now);

    const existingAttendance = await Attendance.findOne({
      gymId: req.user.gymId,
      memberId,
      attendanceDate: {
        $gte: range.start,
        $lt: range.end,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    const attendance = await Attendance.create({
      gymId: req.user.gymId,
      memberId,
      attendanceDate: range.start,
      checkIn: now,
      markedBy: req.user.userId,
      notes: notes || "",
    });

    return res.status(201).json({
      success: true,
      message: "Member checked in successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check-in error:", error);

    // Handle duplicate attendance index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to check in member",
    });
  }
};

// 2. Member Check-out
const checkOutMember = async (req, res) => {
  try {
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Member ID is required",
      });
    }

    const range = getDateRange(new Date());

    const attendance = await Attendance.findOne({
      gymId: req.user.gymId,
      memberId,
      attendanceDate: {
        $gte: range.start,
        $lt: range.end,
      },
      checkOut: null,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No active check-in found for today",
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Member checked out successfully",
      attendance,
    });
  } catch (error) {
    console.error("Check-out error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check out member",
    });
  }
};

// 3. Get All Attendance
const getAllAttendance = async (req, res) => {
  try {
    const { date, memberId } = req.query;

    const filter = {
      gymId: req.user.gymId,
    };

    if (date) {
      const range = getDateRange(date);

      if (!range) {
        return res.status(400).json({
          success: false,
          message: "Invalid date",
        });
      }

      filter.attendanceDate = {
        $gte: range.start,
        $lt: range.end,
      };
    }

    if (memberId) {
      filter.memberId = memberId;
    }

    const attendance = await Attendance.find(filter)
      .populate("memberId", "name phone memberCode")
      .populate("markedBy", "name role")
      .sort({ checkIn: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};

// 4. Get Attendance History of a Member
const getMemberAttendance = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.memberId,
      gymId: req.user.gymId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const attendance = await Attendance.find({
      gymId: req.user.gymId,
      memberId: req.params.memberId,
    })
      .sort({ attendanceDate: -1 })
      .populate("markedBy", "name role");

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Member attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch member attendance",
    });
  }
};

// 5. Daily Attendance Summary
const getDailyAttendanceSummary = async (req, res) => {
  try {
    const range = getDateRange(req.query.date);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const summary = await Attendance.aggregate([
      {
        $match: {
          gymId: req.user.gymId,
          attendanceDate: {
            $gte: range.start,
            $lt: range.end,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      present: 0,
      late: 0,
      total: 0,
    };

    summary.forEach((item) => {
      if (item._id === "PRESENT") result.present = item.count;
      if (item._id === "LATE") result.late = item.count;
    });

    result.total = result.present + result.late;

    return res.status(200).json({
      success: true,
      date: range.start,
      summary: result,
    });
  } catch (error) {
    console.error("Attendance summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
    });
  }
};

module.exports = {
  checkInMember,
  checkOutMember,
  getAllAttendance,
  getMemberAttendance,
  getDailyAttendanceSummary,
};
