
const Facility = require("../Models/Facility.model");
const Gym = require("../Models/Gym.model");

// 1. Create Facility (Admin Only)
const createFacility = async (req, res) => {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Facility name is required",
      });
    }

    const facility = await Facility.create({
      gymId: req.user.gymId,
      name: name.trim(),
      description: description || "",
      imageUrl: imageUrl || "",
      sortOrder: sortOrder ?? 0,
    });

    return res.status(201).json({
      success: true,
      message: "Facility created successfully",
      facility,
    });
  } catch (error) {
    console.error("Create facility error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create facility",
    });
  }
};

// 2. Get Logged-in Gym Facilities
const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({
      gymId: req.user.gymId,
      isActive: true,
    }).sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error) {
    console.error("Get facilities error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch facilities",
    });
  }
};

// 3. Get Public Gym Facilities
const getPublicFacilities = async (req, res) => {
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

    const facilities = await Facility.find({
      gymId: gym._id,
      isActive: true,
    }).sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error) {
    console.error("Get public facilities error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public facilities",
    });
  }
};

// 4. Update Facility (Admin Only)
const updateFacility = async (req, res) => {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Facility name cannot be empty",
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const facility = await Facility.findOneAndUpdate(
      {
        _id: req.params.id,
        gymId: req.user.gymId,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Facility updated successfully",
      facility,
    });
  } catch (error) {
    console.error("Update facility error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update facility",
    });
  }
};

// 5. Change Facility Status (Admin Only)
const updateFacilityStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const facility = await Facility.findOneAndUpdate(
      {
        _id: req.params.id,
        gymId: req.user.gymId,
      },
      { $set: { isActive } },
      { new: true }
    );

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Facility status updated successfully",
      facility,
    });
  } catch (error) {
    console.error("Update facility status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update facility status",
    });
  }
};

// 6. Delete Facility (Admin Only)
const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findOneAndDelete({
      _id: req.params.id,
      gymId: req.user.gymId,
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Facility deleted successfully",
    });
  } catch (error) {
    console.error("Delete facility error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete facility",
    });
  }
};

module.exports = {
  createFacility,
  getFacilities,
  getPublicFacilities,
  updateFacility,
  updateFacilityStatus,
  deleteFacility,
};
