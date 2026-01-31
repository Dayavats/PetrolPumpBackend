const express = require("express");
const router = express.Router();
const Nozzle = require("../models/Nozzle");
const PetrolPump = require("../models/PetrolPump");
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/auth");

// ➕ Create Nozzle/Machine (OWNER only)
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { nozzleNumber, machineNumber, fuelType, petrolPumpId } = req.body;

        const pump = await PetrolPump.findOne({
            _id: petrolPumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        const nozzle = await Nozzle.create({
            nozzleNumber,
            machineNumber,
            fuelType,
            petrolPump: petrolPumpId,
            owner: req.user.id,
        });

        res.status(201).json({
            message: "Nozzle created",
            nozzle,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(400)
                .json({ message: "This nozzle number already exists for this pump" });
        }
        res.status(500).json({ error: error.message });
    }
});

// 📄 Get all nozzles for a pump
router.get("/pump/:pumpId", authMiddleware, async (req, res) => {
    try {
        const nozzles = await Nozzle.find({
            petrolPump: req.params.pumpId,
            owner: req.user.id,
            isActive: true,
        }).populate("assignedEmployee", "name phone role").populate("fuelType");

        res.json(nozzles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Assign employee to nozzle
router.put("/:nozzleId/assign", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { employeeId } = req.body;

        // Verify employee belongs to owner
        const employee = await Employee.findOne({
            _id: employeeId,
            owner: req.user.id,
        });

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const nozzle = await Nozzle.findOneAndUpdate(
            { _id: req.params.nozzleId, owner: req.user.id },
            { assignedEmployee: employeeId },
            { new: true }
        ).populate("assignedEmployee", "name phone role");

        if (!nozzle) {
            return res.status(404).json({ message: "Nozzle not found" });
        }

        res.json({
            message: "Employee assigned to nozzle",
            nozzle,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Update nozzle details
router.put("/:nozzleId", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { nozzleNumber, machineNumber, fuelType } = req.body;

        const nozzle = await Nozzle.findOneAndUpdate(
            { _id: req.params.nozzleId, owner: req.user.id },
            { nozzleNumber, machineNumber, fuelType },
            { new: true, runValidators: true }
        );

        if (!nozzle) {
            return res.status(404).json({ message: "Nozzle not found" });
        }

        res.json({
            message: "Nozzle updated",
            nozzle,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🗑 Deactivate nozzle
router.delete("/:nozzleId", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const nozzle = await Nozzle.findOneAndUpdate(
            { _id: req.params.nozzleId, owner: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!nozzle) {
            return res.status(404).json({ message: "Nozzle not found" });
        }

        res.json({ message: "Nozzle deactivated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
