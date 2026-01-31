const express = require("express");
const router = express.Router();
const DailyReading = require("../models/DailyReading");
const Stock = require("../models/Stock");
const PetrolPump = require("../models/PetrolPump");
const User = require("../models/users");
const PDFService = require("../services/pdfService");
const emailService = require("../services/emailService");
const authMiddleware = require("../middleware/auth");

// 📄 Generate & Download Daily Report PDF
router.get("/daily/:pumpId/:date", authMiddleware, async (req, res) => {
    try {
        const { pumpId, date } = req.params;

        // Verify ownership
        const pump = await PetrolPump.findOne({
            _id: pumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        // Get readings for the date
        const readings = await DailyReading.find({
            petrolPump: pumpId,
            date: new Date(date).setHours(0, 0, 0, 0),
        }).populate("nozzle", "nozzleNumber machineNumber");

        if (readings.length === 0) {
            return res
                .status(404)
                .json({ message: "No readings found for this date" });
        }

        // Calculate summary
        const summary = {
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

        // Get stock data
        const stockData = await Stock.find({
            petrolPump: pumpId,
            date: new Date(date).setHours(0, 0, 0, 0),
        });

        // Generate PDF
        const reportData = {
            pumpName: pump.name,
            pumpLocation: pump.location,
            date,
            readings,
            summary,
            stockData,
        };

        const pdfPath = await PDFService.generateDailyReport(reportData);

        // Send PDF as download
        res.download(pdfPath, `daily_report_${date}.pdf`, (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).json({ error: "Failed to download PDF" });
            }
        });
    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Generate & Email Daily Report
router.post("/daily/:pumpId/:date/email", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { pumpId, date } = req.params;
        const { emailTo } = req.body; // Optional: override default email

        // Verify ownership
        const pump = await PetrolPump.findOne({
            _id: pumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        // Get user email
        const user = await User.findById(req.user.id);
        const recipientEmail = emailTo || user.email;

        // Get readings
        const readings = await DailyReading.find({
            petrolPump: pumpId,
            date: new Date(date).setHours(0, 0, 0, 0),
        }).populate("nozzle", "nozzleNumber machineNumber");

        if (readings.length === 0) {
            return res
                .status(404)
                .json({ message: "No readings found for this date" });
        }

        // Calculate summary
        const summary = {
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

        // Get stock data
        const stockData = await Stock.find({
            petrolPump: pumpId,
            date: new Date(date).setHours(0, 0, 0, 0),
        });

        // Generate PDF
        const reportData = {
            pumpName: pump.name,
            pumpLocation: pump.location,
            date,
            readings,
            summary,
            stockData,
        };

        const pdfPath = await PDFService.generateDailyReport(reportData);

        // Send email
        const emailResult = await emailService.sendDailyReport({
            to: recipientEmail,
            pumpName: pump.name,
            date,
            pdfPath,
            summary,
        });

        res.json({
            message: "Report emailed successfully",
            emailSent: true,
            recipient: recipientEmail,
            messageId: emailResult.messageId,
        });
    } catch (error) {
        console.error("Email report error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 📄 Generate Monthly Report PDF
router.get("/monthly/:pumpId/:year/:month", authMiddleware, async (req, res) => {
    try {
        const { pumpId, year, month } = req.params;

        // Verify ownership
        const pump = await PetrolPump.findOne({
            _id: pumpId,
            owners: req.user.id,
        });

        if (!pump) {
            return res.status(404).json({ message: "Petrol pump not found" });
        }

        // Calculate date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get all readings for the month
        const readings = await DailyReading.find({
            petrolPump: pumpId,
            date: { $gte: startDate, $lte: endDate },
        });

        if (readings.length === 0) {
            return res
                .status(404)
                .json({ message: "No readings found for this month" });
        }

        // Calculate summary
        const summary = {
            totalSales: 0,
            totalLiters: 0,
            cashAmount: 0,
            upiAmount: 0,
            cardAmount: 0,
            fuelWise: {},
        };

        readings.forEach((reading) => {
            summary.totalSales += reading.totalAmount;
            summary.totalLiters += reading.litersSold;
            summary.cashAmount += reading.cashAmount;
            summary.upiAmount += reading.upiAmount;
            summary.cardAmount += reading.cardAmount;

            if (!summary.fuelWise[reading.fuelType]) {
                summary.fuelWise[reading.fuelType] = {
                    liters: 0,
                    amount: 0,
                };
            }

            summary.fuelWise[reading.fuelType].liters += reading.litersSold;
            summary.fuelWise[reading.fuelType].amount += reading.totalAmount;
        });

        // Generate PDF
        const reportData = {
            pumpName: pump.name,
            pumpLocation: pump.location,
            month,
            year,
            summary,
            dailyData: readings,
        };

        const pdfPath = await PDFService.generateMonthlyReport(reportData);

        res.download(pdfPath, `monthly_report_${year}_${month}.pdf`, (err) => {
            if (err) {
                console.error("Download error:", err);
                res.status(500).json({ error: "Failed to download PDF" });
            }
        });
    } catch (error) {
        console.error("Monthly report error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Test email configuration
router.post("/test-email", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { emailTo } = req.body;
        const user = await User.findById(req.user.id);
        const recipientEmail = emailTo || user.email;

        const result = await emailService.sendTestEmail(recipientEmail);

        res.json({
            message: "Test email sent successfully",
            recipient: recipientEmail,
            messageId: result.messageId,
        });
    } catch (error) {
        console.error("Test email error:", error);
        res.status(500).json({
            error: error.message,
            hint: "Make sure EMAIL_USER and EMAIL_PASS are set in .env file",
        });
    }
});

module.exports = router;
