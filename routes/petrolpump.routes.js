const express = require("express");
const router = express.Router();
const PetrolPump = require("../models/PetrolPump");
const auth = require("../middleware/auth");

/**
 * Create Petrol Pump (Owner only)
 */
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Access denied" });
    }

    const pump = new PetrolPump({
      name: req.body.name,
      address: req.body.address,
      contactNumber: req.body.contactNumber,
      registrationNumber: req.body.registrationNumber,
      owners: [req.user.id],
    });

    await pump.save();
    res.json({ message: "Petrol pump created", pump });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get My Petrol Pumps (both /pumps and /pumps/my work)
 */
router.get("/", auth, async (req, res) => {
  try {
    const pumps = await PetrolPump.find({
      owners: req.user.id,
    });
    res.json(pumps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get My Petrol Pumps (alternative route)
 */
router.get("/my", auth, async (req, res) => {
  try {
    const pumps = await PetrolPump.find({
      owners: req.user.id,
    });
    res.json(pumps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
