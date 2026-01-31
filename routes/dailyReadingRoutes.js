const express = require("express");
const router = express.Router();
const DailyReading = require("../models/DailyReading");
const Stock = require("../models/Stock");
const Nozzle = require("../models/Nozzle");
const Fuel = require("../models/Fuel");
const PetrolPump = require("../models/PetrolPump");
const authMiddleware = require("../middleware/auth");

// ➕ Create/Update Daily Reading
router.post("/", authMiddleware, async (req, res, next) => {
    try {
        const {
            date,
            petrolPumpId,
            nozzleId,
            openingReading,
            closingReading,
            cashAmount,
            upiAmount,
            cardAmount,
        } = req.body;

        // Verify pump ownership
        const pump = await PetrolPump.findOne({
            _id: petrolPumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        // Verify nozzle belongs to pump
        const nozzle = await Nozzle.findOne({
            _id: nozzleId,
            petrolPump: petrolPumpId,
            isActive: true,
        });

        if (!nozzle) {
            return res.status(404).json({ message: "Nozzle not found" });
        }

        // Get current fuel price
        const fuel = await Fuel.findOne({
            _id: nozzle.fuelType,
            petrolPump: petrolPumpId,
            isActive: true,
        });

        if (!fuel) {
            return res.status(404).json({ message: "Fuel price not configured" });
        }

        // Check if reading already exists for this date
        let reading = await DailyReading.findOne({
            date: new Date(date).setHours(0, 0, 0, 0),
            nozzle: nozzleId,
            petrolPump: petrolPumpId,
        });

        if (reading && reading.isLocked) {
            return res
                .status(400)
                .json({ message: "This reading is locked and cannot be modified" });
        }

        if (reading) {
            // Update existing reading
            reading.openingReading = openingReading;
            reading.closingReading = closingReading;
            reading.pricePerLiter = fuel.currentPrice;
            reading.cashAmount = cashAmount || 0;
            reading.upiAmount = upiAmount || 0;
            reading.cardAmount = cardAmount || 0;
            reading.enteredBy = req.user.id;
            await reading.save();

            return res.json({
                message: "Reading updated",
                reading,
            });
        }

        // Create new reading
        reading = new DailyReading({
            date: new Date(date).setHours(0, 0, 0, 0),
            petrolPump: petrolPumpId,
            owner: req.user.id,
            nozzle: nozzleId,
            fuelType: fuel.name,
            openingReading,
            closingReading,
            pricePerLiter: fuel.currentPrice,
            cashAmount: cashAmount || 0,
            upiAmount: upiAmount || 0,
            cardAmount: cardAmount || 0,
            enteredBy: req.user.id,
        });

        await reading.save();

        // Auto-update stock after reading is saved
        await updateStockFromReadings(petrolPumpId, date, fuel.name, req.user.id);

        res.status(201).json({
            message: "Daily reading created",
            reading,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to auto-update stock based on readings
async function updateStockFromReadings(petrolPumpId, date, fuelType, userId) {
    try {
        // Get all readings for this fuel type on this date
        const readings = await DailyReading.find({
            date: new Date(date).setHours(0, 0, 0, 0),
            petrolPump: petrolPumpId,
            fuelType: fuelType,
        });

        // Calculate total sold
        const soldStock = readings.reduce((sum, reading) => sum + reading.litersSold, 0);

        // Find or create stock entry
        let stock = await Stock.findOne({
            date: new Date(date).setHours(0, 0, 0, 0),
            petrolPump: petrolPumpId,
            fuelType: fuelType,
        });

        if (stock && !stock.isLocked) {
            // Update sold stock
            stock.soldStock = soldStock;
            await stock.save();
        }
    } catch (error) {
        console.error('Error updating stock from readings:', error);
    }
}

// 📄 Get readings for a pump on a specific date
router.get("/pump/:pumpId/date/:date", authMiddleware, async (req, res, next) => {
    try {
        const { pumpId, date } = req.params;

        const readings = await DailyReading.find({
            petrolPump: pumpId,
            owner: req.user.id,
            date: new Date(date).setHours(0, 0, 0, 0),
        })
            .populate({
                path: "nozzle",
                select: "nozzleNumber machineNumber fuelType",
                populate: {
                    path: "fuelType",
                    select: "name currentPrice"
                }
            })
            .populate("enteredBy", "name email");

        res.json(readings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📊 Get daily summary for a pump
router.get("/pump/:pumpId/summary/:date", authMiddleware, async (req, res, next) => {
    try {
        const { pumpId, date } = req.params;

        const readings = await DailyReading.find({
            petrolPump: pumpId,
            owner: req.user.id,
            date: new Date(date).setHours(0, 0, 0, 0),
        });

        // Calculate totals by fuel type
        const summary = {
            date: new Date(date),
            totalSales: 0,
            cashAmount: 0,
            upiAmount: 0,
            cardAmount: 0,
            fuelWise: {},
        };

        readings.forEach((reading) => {
            summary.totalSales += reading.totalAmount;
            summary.cashAmount += reading.cashAmount;
            summary.upiAmount += reading.upiAmount;
            summary.cardAmount += reading.cardAmount;

            if (!summary.fuelWise[reading.fuelType]) {
                summary.fuelWise[reading.fuelType] = {
                    litersSold: 0,
                    amount: 0,
                };
            }

            summary.fuelWise[reading.fuelType].litersSold += reading.litersSold;
            summary.fuelWise[reading.fuelType].amount += reading.totalAmount;
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔒 Lock daily reading (prevent further edits)
router.put("/:readingId/lock", authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const reading = await DailyReading.findOneAndUpdate(
            { _id: req.params.readingId, owner: req.user.id },
            { isLocked: true },
            { new: true }
        );

        if (!reading) {
            return res.status(404).json({ message: "Reading not found" });
        }

        res.json({
            message: "Reading locked successfully",
            reading,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📊 Get date range report
router.get("/pump/:pumpId/report", authMiddleware, async (req, res, next) => {
    try {
        const { pumpId } = req.params;
        const { startDate, endDate } = req.query;

        const readings = await DailyReading.find({
            petrolPump: pumpId,
            owner: req.user.id,
            date: {
                $gte: new Date(startDate).setHours(0, 0, 0, 0),
                $lte: new Date(endDate).setHours(23, 59, 59, 999),
            },
        })
            .populate("nozzle", "nozzleNumber machineNumber fuelType")
            .sort({ date: 1 });

        // Calculate totals
        const totals = {
            totalLiters: 0,
            totalAmount: 0,
            cashAmount: 0,
            upiAmount: 0,
            cardAmount: 0,
        };

        readings.forEach((reading) => {
            totals.totalLiters += reading.litersSold;
            totals.totalAmount += reading.totalAmount;
            totals.cashAmount += reading.cashAmount;
            totals.upiAmount += reading.upiAmount;
            totals.cardAmount += reading.cardAmount;
        });

        res.json({
            startDate,
            endDate,
            readings,
            totals,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
