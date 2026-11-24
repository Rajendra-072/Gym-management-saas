
// const jwt = require("jsonwebtoken");

// const protect = (req, res, next) => {
//   try {
//     const token = req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required. Please login.",
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = {
//       userId: decoded.userId,
//       gymId: decoded.gymId,
//       role: decoded.role,
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token. Please login again.",
//     });
//   }
// };

// // Role-based authorization
// const authorize = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to access this resource.",
//       });
//     }

//     next();
//   };
// };

// module.exports = { protect, authorize };



const jwt = require("jsonwebtoken");
const User = require("../Models/User.model");

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.userId,
      gymId: decoded.gymId,
      isActive: true,
    }).select("_id gymId role isActive");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or no longer exists",
      });
    }

    req.user = {
      userId: user._id.toString(),
      gymId: user.gymId.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
