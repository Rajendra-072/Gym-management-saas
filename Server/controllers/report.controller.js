
const mongoose = require("mongoose");

const Attendance = require("../Models/Attendance.model");
const Membership = require("../Models/Membership.model");
const Member = require("../Models/Member.model");

// ==========================================
// 1. ATTENDANCE REPORT
// ==========================================

const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const gymId = new mongoose.Types.ObjectId(req.user.gymId);

    const attendance = await Attendance.find({
      gymId,
      attendanceDate: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("memberId", "name phone memberCode")
      .populate("markedBy", "name role")
      .sort({ attendanceDate: -1 });

    const summary = await Attendance.aggregate([
      {
        $match: {
          gymId,
          attendanceDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 },
        },
      },
    ]);

    const present =
      summary.find((item) => item._id === "PRESENT")?.total || 0;

    const late =
      summary.find((item) => item._id === "LATE")?.total || 0;

    return res.status(200).json({
      success: true,
      report: {
        startDate,
        endDate,
        totalAttendance: present + late,
        present,
        late,
        attendance,
      },
    });
  } catch (error) {
    console.error("Attendance Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate attendance report",
      error: error.message,
    });
  }
};

// ==========================================
// 2. MEMBERSHIP REPORT
// ==========================================

const getMembershipReport = async (req, res) => {
  try {
    const gymId = new mongoose.Types.ObjectId(req.user.gymId);
    const { status } = req.query;

    const allowedStatuses = ["ACTIVE", "EXPIRED", "CANCELLED"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership status",
      });
    }

    const filter = { gymId };

    if (status) {
      filter.status = status;
    }

    const [total, active, expired, cancelled, memberships] =
      await Promise.all([
        Membership.countDocuments({ gymId }),
        Membership.countDocuments({
          gymId,
          status: "ACTIVE",
        }),
        Membership.countDocuments({
          gymId,
          status: "EXPIRED",
        }),
        Membership.countDocuments({
          gymId,
          status: "CANCELLED",
        }),
        Membership.find(filter)
          .populate("memberId", "name phone memberCode")
          .populate(
            "planId",
            "name duration durationType price"
          )
          .sort({ createdAt: -1 }),
      ]);

    return res.status(200).json({
      success: true,
      report: {
        total,
        active,
        expired,
        cancelled,
        memberships,
      },
    });
  } catch (error) {
    console.error("Membership Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate membership report",
      error: error.message,
    });
  }
};

// ==========================================
// 3. MEMBER GROWTH REPORT
// ==========================================

const getMemberGrowthReport = async (req, res) => {
  try {
    const gymId = new mongoose.Types.ObjectId(req.user.gymId);

    const { year } = req.query;

    const selectedYear = year
      ? Number(year)
      : new Date().getFullYear();

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear + 1, 0, 1);

    const monthlyGrowth = await Member.aggregate([
      {
        $match: {
          gymId,
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
          },
          totalMembers: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    // Generate all 12 months
    const months = Array.from(
      { length: 12 },
      (_, index) => ({
        month: index + 1,
        monthName: new Date(
          selectedYear,
          index,
          1
        ).toLocaleString("en-US", {
          month: "long",
        }),
        totalMembers: 0,
      })
    );

    // Insert database results
    monthlyGrowth.forEach((item) => {
      months[item._id.month - 1].totalMembers =
        item.totalMembers;
    });

    const totalNewMembers = months.reduce(
      (total, item) => total + item.totalMembers,
      0
    );

    return res.status(200).json({
      success: true,
      report: {
        year: selectedYear,
        totalNewMembers,
        monthlyGrowth: months,
      },
    });
  } catch (error) {
    console.error("Member Growth Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate member growth report",
      error: error.message,
    });
  }

  
};


const getMembershipExpiryReport = async (req, res) => {
  try {
    const gymId = new mongoose.Types.ObjectId(req.user.gymId);

    const {
      range = "7",
      startDate,
      endDate,
      status = "ALL",
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    // 1. Validate range
    const allowedRanges = ["today", "7", "30", "all", "custom"];

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        success: false,
        message: "Invalid range. Use today, 7, 30, all or custom",
      });
    }

    // 2. Validate status
    const allowedStatuses = ["ALL", "ACTIVE", "EXPIRED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership status",
      });
    }

    // 3. Validate pagination
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

    // 4. Date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 8);

    sevenDaysLater.setMilliseconds(-1);

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 31);
    thirtyDaysLater.setMilliseconds(-1);

    let dateFilter = {};

    // 5. Apply date range
    if (range === "today") {
      dateFilter = {
        $gte: today,
        $lt: tomorrow,
      };
    } else if (range === "7") {
      dateFilter = {
        $gte: today,
        $lt: new Date(
          new Date(today).setDate(today.getDate() + 8)
        ),
      };
    } else if (range === "30") {
      dateFilter = {
        $gte: today,
        $lt: new Date(
          new Date(today).setDate(today.getDate() + 31)
        ),
      };
    } else if (range === "custom") {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required for custom range",
        });
      }

      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59.999`);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid custom date range",
        });
      }

      dateFilter = {
        $gte: start,
        $lte: end,
      };
    }

    // 6. Build base query
    const baseFilter = {
      gymId,
      status: { $ne: "CANCELLED" },
    };

    // Status filter
    if (status !== "ALL") {
      baseFilter.status = status;
    }

    // Date filter
    if (range !== "all") {
      baseFilter.endDate = dateFilter;
    }

    // 7. Search members
    const memberIds = await Member.find({
      gymId,
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
              { memberCode: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    }).distinct("_id");

    if (search) {
      baseFilter.memberId = { $in: memberIds };
    }

    // 8. Fetch expiry records with pagination
    const skip = (currentPage - 1) * pageLimit;

    const [memberships, totalRecords] = await Promise.all([
      Membership.find(baseFilter)
        .populate("memberId", "name phone memberCode email")
        .populate("planId", "name duration durationType price")
        .populate("assignedBy", "name email role")
        .sort({ endDate: 1 })
        .skip(skip)
        .limit(pageLimit),

      Membership.countDocuments(baseFilter),
    ]);

    // 9. Calculate overall expiry summary
    const summaryFilter = {
      gymId,
      status: { $ne: "CANCELLED" },
    };

    const [
      expiredCount,
      todayCount,
      next7DaysCount,
      next30DaysCount,
      activeCount,
      cancelledCount,
    ] = await Promise.all([
      Membership.countDocuments({
        gymId,
        endDate: { $lt: today },
        status: { $ne: "CANCELLED" },
      }),

      Membership.countDocuments({
        ...summaryFilter,
        endDate: {
          $gte: today,
          $lt: tomorrow,
        },
      }),

      Membership.countDocuments({
        ...summaryFilter,
        endDate: {
          $gte: today,
          $lt: new Date(
            new Date(today).setDate(today.getDate() + 8)
          ),
        },
      }),

      Membership.countDocuments({
        ...summaryFilter,
        endDate: {
          $gte: today,
          $lt: new Date(
            new Date(today).setDate(today.getDate() + 31)
          ),
        },
      }),

      Membership.countDocuments({
        gymId,
        status: "ACTIVE",
        endDate: { $gte: today },
      }),

      Membership.countDocuments({
        gymId,
        status: "CANCELLED",
      }),
    ]);

    // 10. Pagination information
    const totalPages = Math.ceil(totalRecords / pageLimit);

    // 11. Final response
    return res.status(200).json({
      success: true,
      message: "Membership expiry report generated successfully",

      filters: {
        range,
        status,
        search,
        startDate: startDate || null,
        endDate: endDate || null,
      },

      summary: {
        expiredCount,
        todayCount,
        next7DaysCount,
        next30DaysCount,
        activeCount,
        cancelledCount,
      },

      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      memberships,
    });
  } catch (error) {
    console.error("Membership Expiry Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate membership expiry report",
      error: error.message,
    });
  }
};



const getEnquiryReport = async (req, res) => {
  try {
    const Enquiry = require("../Models/Enquiry.model");

    const gymId = new mongoose.Types.ObjectId(req.user.gymId);

    const {
      status = "ALL",
      startDate,
      endDate,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    // 1. Validate status
    const allowedStatuses = [
      "ALL",
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

    // 2. Validate pagination
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

    // 3. Base filter
    const filter = { gymId };

    // 4. Status filter
    if (status !== "ALL") {
      filter.status = status;
    }

    // 5. Date filter
    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        dateFilter.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        dateFilter.$lte = end;
      }

      if (
        dateFilter.$gte &&
        dateFilter.$lte &&
        dateFilter.$gte > dateFilter.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date",
        });
      }

      filter.createdAt = dateFilter;
    }

    // 6. Search filter
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // 7. Fetch enquiries
    const skip = (currentPage - 1) * pageLimit;

    const [enquiries, totalRecords] = await Promise.all([
      Enquiry.find(filter)
        .populate(
          "interestedPlan",
          "name duration durationType price"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      Enquiry.countDocuments(filter),
    ]);

    // 8. Overall status summary for this gym
    const summary = await Enquiry.aggregate([
      {
        $match: { gymId },
      },
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 },
        },
      },
    ]);

    const getCount = (key) =>
      summary.find((item) => item._id === key)?.total || 0;

    const totalEnquiries = summary.reduce(
      (total, item) => total + item.total,
      0
    );

    const newEnquiries = getCount("NEW");
    const contactedEnquiries = getCount("CONTACTED");
    const convertedEnquiries = getCount("CONVERTED");
    const closedEnquiries = getCount("CLOSED");

    const conversionRate =
      totalEnquiries > 0
        ? Number(
            ((convertedEnquiries / totalEnquiries) * 100).toFixed(2)
          )
        : 0;

    // 9. Pagination
    const totalPages = Math.ceil(totalRecords / pageLimit);

    // 10. Response
    return res.status(200).json({
      success: true,
      message: "Enquiry report generated successfully",

      summary: {
        totalEnquiries,
        newEnquiries,
        contactedEnquiries,
        convertedEnquiries,
        closedEnquiries,
        conversionRate,
      },

      filters: {
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        search,
      },

      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },

      enquiries,
    });
  } catch (error) {
    console.error("Enquiry Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate enquiry report",
      error: error.message,
    });
  }
};


// ==========================================
// EXPORT ALL REPORT CONTROLLERS
// ==========================================

module.exports = {
  getAttendanceReport,
  getMembershipReport,
  getMemberGrowthReport,
  getMembershipExpiryReport,
  getEnquiryReport,
};
