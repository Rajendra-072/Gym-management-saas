
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const gymRoutes = require("./routes/gym.routes");
const facilityRoutes = require("./routes/facility.routes");
const membershipPlanRoutes = require("./routes/membershipPlan.routes");
const enquiryRoutes = require("./routes/enquiry.routes");
const memberRoutes = require("./routes/member.routes");
const membershipRoutes = require("./routes/membership.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const notificationRoutes = require("./routes/notification.routes");
const {
  startMembershipReminderJob,
} = require("./Jobs/membershipReminder.job");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportRoutes = require("./routes/report.routes");
const staffRoutes = require("./routes/staff.routes");



require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

//route
app.use("/api/auth", authRoutes);
app.use("/api/gym", gymRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/membership-plans", membershipPlanRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/staff", staffRoutes);


// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gym Management SaaS API is running!",
  });
});

// Start server after database connection
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
     startMembershipReminderJob();
  });
};

startServer();
