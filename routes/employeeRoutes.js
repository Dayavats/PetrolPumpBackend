const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const PetrolPump = require("../models/PetrolPump");
const authMiddleware = require("../middleware/auth");

// ➕ Create Employee (OWNER only)
router.post("/", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, phone, role, salary, petrolPumpId } = req.body;

        const pump = await PetrolPump.findOne({
            _id: petrolPumpId,
            owners: req.user.id
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        const employee = await Employee.create({
            name,
            phone,
            role,
            salary,
            petrolPump: petrolPumpId,
            owner: req.user.id,
        });

        res.status(201).json({
            message: "Employee created",
            employee,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📄 Get employees of a pump
router.get("/pump/:pumpId", authMiddleware, async (req, res, next) => {
    try {
        const employees = await Employee.find({
            petrolPump: req.params.pumpId,
            owner: req.user.id,
        });

        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Update employee
router.put("/:employeeId", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, phone, role, salary } = req.body;

        const employee = await Employee.findOneAndUpdate(
            { _id: req.params.employeeId, owner: req.user.id },
            { name, phone, role, salary },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({
            message: "Employee updated",
            employee,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🗑 Deactivate employee
router.delete("/:employeeId", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const employee = await Employee.findOneAndUpdate(
            { _id: req.params.employeeId, owner: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee deactivated", employee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📄 Get single employee
router.get("/:employeeId", authMiddleware, async (req, res, next) => {
    try {
        const employee = await Employee.findOne({
            _id: req.params.employeeId,
            owner: req.user.id,
        }).populate("petrolPump", "name location");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
