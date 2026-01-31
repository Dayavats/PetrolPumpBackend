const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");
const PetrolPump = require("../models/PetrolPump");
const DailyReading = require("../models/DailyReading");
const authMiddleware = require("../middleware/auth");

// ➕ Create/Update Daily Stock Entry
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const {
            date,
            petrolPumpId,
            fuelType,
            openingStock,
            purchasedStock,
            purchaseDetails,
        } = req.body;

        // Verify pump ownership
        const pump = await PetrolPump.findOne({
            _id: petrolPumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        // Check if stock entry exists
        let stock = await Stock.findOne({
            date: new Date(date).setHours(0, 0, 0, 0),
            petrolPump: petrolPumpId,
            fuelType,
        });

        if (stock && stock.isLocked) {
            return res
                .status(400)
                .json({ message: "This stock entry is locked and cannot be modified" });
        }

        // Get total sold from daily readings
        const readings = await DailyReading.find({
            date: new Date(date).setHours(0, 0, 0, 0),
            petrolPump: petrolPumpId,
            fuelType,
        });

        const soldStock = readings.reduce(
            (sum, reading) => sum + reading.litersSold,
            0
        );

        if (stock) {
            // Update existing stock
            stock.openingStock = openingStock;
            stock.purchasedStock = purchasedStock || 0;
            stock.soldStock = soldStock;
            stock.purchaseDetails = purchaseDetails || [];
            stock.enteredBy = req.user.id;
            await stock.save();

            return res.json({
                message: "Stock updated",
                stock,
            });
        }

        // Create new stock entry
        stock = await Stock.create({
            date: new Date(date).setHours(0, 0, 0, 0),
            petrolPump: petrolPumpId,
            owner: req.user.id,
            fuelType,
            openingStock,
            purchasedStock: purchasedStock || 0,
            soldStock,
            purchaseDetails: purchaseDetails || [],
            enteredBy: req.user.id,
        });

        res.status(201).json({
            message: "Stock entry created",
            stock,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res
                .status(400)
                .json({ message: "Stock entry already exists for this date" });
        }
        res.status(500).json({ error: error.message });
    }
});

// 📄 Get stock for a pump on a specific date
router.get("/pump/:pumpId/date/:date", authMiddleware, async (req, res) => {
    try {
        const { pumpId, date } = req.params;

        const stocks = await Stock.find({
            petrolPump: pumpId,
            owner: req.user.id,
            date: new Date(date).setHours(0, 0, 0, 0),
        }).populate("enteredBy", "name email");

        res.json(stocks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📊 Get stock summary for a fuel type (date range)
router.get("/pump/:pumpId/fuel/:fuelType", authMiddleware, async (req, res) => {
    try {
        const { pumpId, fuelType } = req.params;
        const { startDate, endDate } = req.query;

        const stocks = await Stock.find({
            petrolPump: pumpId,
            owner: req.user.id,
            fuelType,
            date: {
                $gte: new Date(startDate).setHours(0, 0, 0, 0),
                $lte: new Date(endDate).setHours(23, 59, 59, 999),
            },
        }).sort({ date: 1 });

        // Calculate totals
        const summary = {
            totalPurchased: 0,
            totalSold: 0,
            totalVariance: 0,
            entries: stocks,
        };

        stocks.forEach((stock) => {
            summary.totalPurchased += stock.purchasedStock;
            summary.totalSold += stock.soldStock;
            summary.totalVariance += stock.variance;
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Add purchase to existing stock
router.put("/:stockId/purchase", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { quantity, pricePerLiter, supplier, invoiceNumber } = req.body;

        const stock = await Stock.findOne({
            _id: req.params.stockId,
            owner: req.user.id,
        });

        if (!stock) {
            return res.status(404).json({ message: "Stock entry not found" });
        }

        if (stock.isLocked) {
            return res
                .status(400)
                .json({ message: "Stock entry is locked and cannot be modified" });
        }

        stock.purchasedStock += quantity;
        stock.purchaseDetails.push({
            quantity,
            pricePerLiter,
            totalCost: quantity * pricePerLiter,
            supplier,
            invoiceNumber,
            purchaseDate: new Date(),
        });

        await stock.save();

        res.json({
            message: "Purchase added to stock",
            stock,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔒 Lock stock entry (prevent further edits)
router.put("/:stockId/lock", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const stock = await Stock.findOneAndUpdate(
            { _id: req.params.stockId, owner: req.user.id },
            { isLocked: true },
            { new: true }
        );

        if (!stock) {
            return res.status(404).json({ message: "Stock entry not found" });
        }

        res.json({
            message: "Stock entry locked successfully",
            stock,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔄 Sync stock with daily readings (recalculate sold stock)
router.put("/:stockId/sync", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const stock = await Stock.findOne({
            _id: req.params.stockId,
            owner: req.user.id,
        });

        if (!stock) {
            return res.status(404).json({ message: "Stock entry not found" });
        }

        if (stock.isLocked) {
            return res
                .status(400)
                .json({ message: "Stock entry is locked and cannot be synced" });
        }

        // Recalculate sold stock from daily readings
        const readings = await DailyReading.find({
            date: stock.date,
            petrolPump: stock.petrolPump,
            fuelType: stock.fuelType,
        });

        stock.soldStock = readings.reduce(
            (sum, reading) => sum + reading.litersSold,
            0
        );

        await stock.save();

        res.json({
            message: "Stock synced with daily readings",
            stock,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🚨 Get low stock alerts for a pump
router.get("/alerts/:pumpId", authMiddleware, async (req, res) => {
    try {
        const { pumpId } = req.params;
        const today = new Date().setHours(0, 0, 0, 0);

        // Get today's stock
        const stocks = await Stock.find({
            petrolPump: pumpId,
            owner: req.user.id,
            date: today,
        });

        const alerts = [];
        const REORDER_THRESHOLD = 0.25; // 25% of capacity

        stocks.forEach(stock => {
            const tankCapacity = stock.tankCapacity || 10000;
            const percentageRemaining = (stock.closingStock / tankCapacity) * 100;
            
            if (percentageRemaining <= 25) {
                alerts.push({
                    fuelType: stock.fuelType,
                    closingStock: stock.closingStock,
                    tankCapacity: tankCapacity,
                    percentageRemaining: percentageRemaining.toFixed(1),
                    status: percentageRemaining <= 10 ? 'critical' : 'low',
                    message: percentageRemaining <= 10 
                        ? `🚨 CRITICAL: ${stock.fuelType} stock is critically low (${percentageRemaining.toFixed(1)}%)`
                        : `⚠️ WARNING: ${stock.fuelType} stock is low (${percentageRemaining.toFixed(1)}%)`,
                    _id: stock._id
                });
            }
        });

        res.json({ alerts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
