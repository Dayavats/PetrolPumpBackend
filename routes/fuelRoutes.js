const express = require("express");
const router = express.Router();
const Fuel = require("../models/Fuel");
const PetrolPump = require("../models/PetrolPump");
const authMiddleware = require("../middleware/auth");

// ➕ Create Fuel Type (OWNER only)
router.post("/", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, petrolPumpId, currentPrice } = req.body;

        const pump = await PetrolPump.findOne({
            _id: petrolPumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        const fuel = await Fuel.create({
            name,
            petrolPump: petrolPumpId,
            owner: req.user.id,
            currentPrice,
            priceHistory: [
                {
                    price: currentPrice,
                    effectiveDate: new Date(),
                    updatedBy: req.user.id,
                },
            ],
        });

        res.status(201).json({
            message: "Fuel type created",
            fuel,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(400)
                .json({ message: "This fuel type already exists for this pump" });
        }
        res.status(500).json({ error: error.message });
    }
});

// 📄 Get all fuel types for a pump
router.get("/pump/:pumpId", authMiddleware, async (req, res, next) => {
    try {
        const fuels = await Fuel.find({
            petrolPump: req.params.pumpId,
            owner: req.user.id,
            isActive: true,
        });

        res.json(fuels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Update fuel price
router.put("/:fuelId/price", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { newPrice } = req.body;
        const fuel = await Fuel.findOne({
            _id: req.params.fuelId,
            owner: req.user.id,
        });

        if (!fuel) {
            return res.status(404).json({ message: "Fuel not found" });
        }

        fuel.currentPrice = newPrice;
        fuel.priceHistory.push({
            price: newPrice,
            effectiveDate: new Date(),
            updatedBy: req.user.id,
        });

        await fuel.save();

        res.json({
            message: "Price updated",
            fuel,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🗑 Deactivate fuel type
router.delete("/:fuelId", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const fuel = await Fuel.findOneAndUpdate(
            { _id: req.params.fuelId, owner: req.user.id },
            { isActive: false },
            { new: true }
        );

        if (!fuel) {
            return res.status(404).json({ message: "Fuel not found" });
        }

        res.json({ message: "Fuel type deactivated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
