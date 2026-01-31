const cron = require("node-cron");
const DailyReading = require("../models/DailyReading");
const Stock = require("../models/Stock");
const PetrolPump = require("../models/PetrolPump");
const User = require("../models/users");
const PDFService = require("../services/pdfService");
const emailService = require("../services/emailService");

class CronService {
    /**
     * Initialize all cron jobs
     */
    static init() {
        console.log("🕒 Initializing cron jobs...");

        // Daily report at 11:59 PM
        this.scheduleDailyReport();

        // Monthly report on 1st of every month at 9:00 AM
        this.scheduleMonthlyReport();

        console.log("✅ Cron jobs initialized");
    }

    /**
     * Send daily reports for all pumps
     * Runs every day at 11:59 PM
     */
    static scheduleDailyReport() {
        // Cron format: second minute hour day month weekday
        // "59 23 * * *" = Every day at 11:59 PM
        cron.schedule("59 23 * * *", async () => {
            console.log("\n🔔 Running daily report cron job...");
            console.log("Time:", new Date().toLocaleString("en-IN"));

            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Get all pumps
                const pumps = await PetrolPump.find({}).populate("owners");

                console.log(`📊 Processing ${pumps.length} petrol pumps...`);

                for (const pump of pumps) {
                    try {
                        // Get readings for today
                        const readings = await DailyReading.find({
                            petrolPump: pump._id,
                            date: today,
                        }).populate("nozzle", "nozzleNumber machineNumber");

                        // Skip if no readings
                        if (readings.length === 0) {
                            console.log(
                                `⏭️  Skipping ${pump.name} - No readings for today`
                            );
                            continue;
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

                            summary.fuelWise[reading.fuelType].litersSold +=
                                reading.litersSold;
                            summary.fuelWise[reading.fuelType].amount +=
                                reading.totalAmount;
                        });

                        // Get stock data
                        const stockData = await Stock.find({
                            petrolPump: pump._id,
                            date: today,
                        });

                        // Generate PDF
                        const reportData = {
                            pumpName: pump.name,
                            pumpLocation: pump.location,
                            date: today,
                            readings,
                            summary,
                            stockData,
                        };

                        const pdfPath = await PDFService.generateDailyReport(
                            reportData
                        );

                        // Send email to all owners
                        for (const ownerId of pump.owners) {
                            const owner = await User.findById(ownerId);
                            if (owner && owner.email) {
                                await emailService.sendDailyReport({
                                    to: owner.email,
                                    pumpName: pump.name,
                                    date: today,
                                    pdfPath,
                                    summary,
                                });
                                console.log(
                                    `✅ Report sent to ${owner.email} for ${pump.name}`
                                );
                            }
                        }
                    } catch (pumpError) {
                        console.error(
                            `❌ Error processing ${pump.name}:`,
                            pumpError.message
                        );
                    }
                }

                console.log("✅ Daily report cron job completed\n");
            } catch (error) {
                console.error("❌ Cron job error:", error);
            }
        });

        console.log("✅ Daily report scheduled for 11:59 PM");
    }

    /**
     * Send monthly reports
     * Runs on 1st of every month at 9:00 AM
     */
    static scheduleMonthlyReport() {
        // "0 9 1 * *" = 1st day of every month at 9:00 AM
        cron.schedule("0 9 1 * *", async () => {
            console.log("\n🔔 Running monthly report cron job...");
            console.log("Time:", new Date().toLocaleString("en-IN"));

            try {
                const now = new Date();
                const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                const month = lastMonth + 1;

                // Calculate date range for last month
                const startDate = new Date(year, lastMonth, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);

                // Get all pumps
                const pumps = await PetrolPump.find({}).populate("owners");

                console.log(
                    `📊 Generating monthly reports for ${month}/${year}...`
                );

                for (const pump of pumps) {
                    try {
                        // Get readings for last month
                        const readings = await DailyReading.find({
                            petrolPump: pump._id,
                            date: { $gte: startDate, $lte: endDate },
                        });

                        if (readings.length === 0) {
                            console.log(
                                `⏭️  Skipping ${pump.name} - No readings for last month`
                            );
                            continue;
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

                            summary.fuelWise[reading.fuelType].liters +=
                                reading.litersSold;
                            summary.fuelWise[reading.fuelType].amount +=
                                reading.totalAmount;
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

                        const pdfPath = await PDFService.generateMonthlyReport(
                            reportData
                        );

                        // Send email to all owners
                        for (const ownerId of pump.owners) {
                            const owner = await User.findById(ownerId);
                            if (owner && owner.email) {
                                await emailService.sendMonthlyReport({
                                    to: owner.email,
                                    pumpName: pump.name,
                                    month,
                                    year,
                                    pdfPath,
                                    summary,
                                });
                                console.log(
                                    `✅ Monthly report sent to ${owner.email} for ${pump.name}`
                                );
                            }
                        }
                    } catch (pumpError) {
                        console.error(
                            `❌ Error processing ${pump.name}:`,
                            pumpError.message
                        );
                    }
                }

                console.log("✅ Monthly report cron job completed\n");
            } catch (error) {
                console.error("❌ Monthly cron job error:", error);
            }
        });

        console.log("✅ Monthly report scheduled for 1st of every month at 9:00 AM");
    }

    /**
     * Manually trigger daily report (for testing)
     */
    static async triggerDailyReport(pumpId, date) {
        console.log("🔔 Manually triggering daily report...");

        const pump = await PetrolPump.findById(pumpId).populate("owners");
        if (!pump) {
            throw new Error("Pump not found");
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const readings = await DailyReading.find({
            petrolPump: pumpId,
            date: targetDate,
        }).populate("nozzle", "nozzleNumber machineNumber");

        if (readings.length === 0) {
            throw new Error("No readings found for this date");
        }

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

        const stockData = await Stock.find({
            petrolPump: pumpId,
            date: targetDate,
        });

        const reportData = {
            pumpName: pump.name,
            pumpLocation: pump.location,
            date: targetDate,
            readings,
            summary,
            stockData,
        };

        const pdfPath = await PDFService.generateDailyReport(reportData);

        // Send to all owners
        const results = [];
        for (const ownerId of pump.owners) {
            const owner = await User.findById(ownerId);
            if (owner && owner.email) {
                const result = await emailService.sendDailyReport({
                    to: owner.email,
                    pumpName: pump.name,
                    date: targetDate,
                    pdfPath,
                    summary,
                });
                results.push({ email: owner.email, ...result });
            }
        }

        return results;
    }
}

module.exports = CronService;
