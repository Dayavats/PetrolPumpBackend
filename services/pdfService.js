const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFService {
    /**
     * Generate daily sales report PDF
     * @param {Object} data - Report data
     * @param {String} filePath - Output file path
     * @returns {Promise<String>} - Path to generated PDF
     */
    static async generateDailyReport(data) {
        return new Promise((resolve, reject) => {
            try {
                const {
                    pumpName,
                    pumpLocation,
                    date,
                    readings,
                    summary,
                    stockData,
                } = data;

                // Create PDF document
                const doc = new PDFDocument({ margin: 50 });

                // Generate filename
                const dateStr = new Date(date)
                    .toISOString()
                    .split("T")[0]
                    .replace(/-/g, "");
                const fileName = `daily_report_${dateStr}.pdf`;
                const reportsDir = path.join(__dirname, "../reports");

                // Ensure reports directory exists
                if (!fs.existsSync(reportsDir)) {
                    fs.mkdirSync(reportsDir, { recursive: true });
                }

                const filePath = path.join(reportsDir, fileName);
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);

                // Header
                doc.fontSize(20)
                    .font("Helvetica-Bold")
                    .text("DAILY SALES REPORT", { align: "center" });

                doc.moveDown();

                // Pump Details
                doc.fontSize(12)
                    .font("Helvetica-Bold")
                    .text(`Petrol Pump: ${pumpName}`, { continued: false });
                doc.fontSize(10)
                    .font("Helvetica")
                    .text(`Location: ${pumpLocation}`);
                doc.text(`Date: ${new Date(date).toLocaleDateString("en-IN")}`);
                doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`);

                doc.moveDown();
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown();

                // Summary Section
                doc.fontSize(14)
                    .font("Helvetica-Bold")
                    .text("SALES SUMMARY", { underline: true });
                doc.moveDown(0.5);

                doc.fontSize(11).font("Helvetica");
                const summaryY = doc.y;

                // Left column
                doc.text(`Total Sales:`, 50, summaryY, { continued: true })
                    .font("Helvetica-Bold")
                    .text(` ₹${summary.totalSales.toLocaleString("en-IN")}`, {
                        align: "left",
                    });

                doc.font("Helvetica")
                    .text(`Cash Amount:`, 50, doc.y, { continued: true })
                    .text(` ₹${summary.cashAmount.toLocaleString("en-IN")}`);

                doc.text(`UPI Amount:`, 50, doc.y, { continued: true }).text(
                    ` ₹${summary.upiAmount.toLocaleString("en-IN")}`
                );

                doc.text(`Card Amount:`, 50, doc.y, { continued: true }).text(
                    ` ₹${summary.cardAmount.toLocaleString("en-IN")}`
                );

                doc.moveDown();

                // Fuel-wise Summary
                doc.fontSize(12)
                    .font("Helvetica-Bold")
                    .text("FUEL-WISE BREAKDOWN");
                doc.moveDown(0.5);

                Object.keys(summary.fuelWise).forEach((fuel) => {
                    const fuelData = summary.fuelWise[fuel];
                    doc.fontSize(11)
                        .font("Helvetica-Bold")
                        .text(`${fuel}:`, { continued: true })
                        .font("Helvetica")
                        .text(
                            ` ${fuelData.litersSold.toLocaleString(
                                "en-IN"
                            )} Liters = ₹${fuelData.amount.toLocaleString("en-IN")}`
                        );
                });

                doc.moveDown();
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown();

                // Readings Table
                doc.fontSize(14)
                    .font("Helvetica-Bold")
                    .text("NOZZLE-WISE READINGS");
                doc.moveDown(0.5);

                // Table Header
                const tableTop = doc.y;
                const col1X = 50;
                const col2X = 120;
                const col3X = 200;
                const col4X = 280;
                const col5X = 360;
                const col6X = 460;

                doc.fontSize(9).font("Helvetica-Bold");
                doc.text("Nozzle", col1X, tableTop);
                doc.text("Fuel", col2X, tableTop);
                doc.text("Opening", col3X, tableTop);
                doc.text("Closing", col4X, tableTop);
                doc.text("Liters", col5X, tableTop);
                doc.text("Amount (₹)", col6X, tableTop);

                doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

                // Table Rows
                let rowY = tableTop + 20;
                doc.font("Helvetica");

                readings.forEach((reading) => {
                    if (rowY > 700) {
                        // New page if content overflows
                        doc.addPage();
                        rowY = 50;
                    }

                    doc.text(
                        reading.nozzle?.nozzleNumber || "N/A",
                        col1X,
                        rowY
                    );
                    doc.text(reading.fuelType, col2X, rowY);
                    doc.text(reading.openingReading.toString(), col3X, rowY);
                    doc.text(reading.closingReading.toString(), col4X, rowY);
                    doc.text(reading.litersSold.toString(), col5X, rowY);
                    doc.text(
                        reading.totalAmount.toLocaleString("en-IN"),
                        col6X,
                        rowY
                    );

                    rowY += 20;
                });

                doc.moveDown();

                // Stock Information
                if (stockData && stockData.length > 0) {
                    doc.addPage();
                    doc.fontSize(14)
                        .font("Helvetica-Bold")
                        .text("STOCK INFORMATION");
                    doc.moveDown(0.5);

                    stockData.forEach((stock) => {
                        doc.fontSize(11)
                            .font("Helvetica-Bold")
                            .text(`${stock.fuelType}:`, { underline: true });
                        doc.fontSize(10).font("Helvetica");
                        doc.text(`Opening Stock: ${stock.openingStock}L`);
                        doc.text(`Purchased: ${stock.purchasedStock}L`);
                        doc.text(`Total Available: ${stock.totalAvailable}L`);
                        doc.text(`Sold: ${stock.soldStock}L`);
                        doc.text(`Closing Stock: ${stock.closingStock}L`);
                        doc.text(`Variance: ${stock.variance}L`);
                        doc.moveDown();
                    });
                }

                // Footer
                doc.fontSize(8)
                    .font("Helvetica")
                    .text(
                        "This is a system-generated report. No signature required.",
                        50,
                        750,
                        { align: "center" }
                    );

                doc.end();

                stream.on("finish", () => {
                    resolve(filePath);
                });

                stream.on("error", (err) => {
                    reject(err);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate monthly summary report
     */
    static async generateMonthlyReport(data) {
        return new Promise((resolve, reject) => {
            try {
                const { pumpName, pumpLocation, month, year, summary, dailyData } =
                    data;

                const doc = new PDFDocument({ margin: 50 });

                const fileName = `monthly_report_${year}_${month}.pdf`;
                const reportsDir = path.join(__dirname, "../reports");

                if (!fs.existsSync(reportsDir)) {
                    fs.mkdirSync(reportsDir, { recursive: true });
                }

                const filePath = path.join(reportsDir, fileName);
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);

                // Header
                doc.fontSize(20)
                    .font("Helvetica-Bold")
                    .text("MONTHLY SALES REPORT", { align: "center" });

                doc.moveDown();

                doc.fontSize(12)
                    .font("Helvetica-Bold")
                    .text(`Petrol Pump: ${pumpName}`);
                doc.fontSize(10)
                    .font("Helvetica")
                    .text(`Location: ${pumpLocation}`);
                doc.text(`Period: ${month}/${year}`);
                doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`);

                doc.moveDown();
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown();

                // Summary
                doc.fontSize(14)
                    .font("Helvetica-Bold")
                    .text("MONTHLY SUMMARY");
                doc.moveDown(0.5);

                doc.fontSize(11).font("Helvetica");
                doc.text(`Total Sales: ₹${summary.totalSales.toLocaleString("en-IN")}`);
                doc.text(`Total Liters: ${summary.totalLiters.toLocaleString("en-IN")}L`);
                doc.text(`Cash: ₹${summary.cashAmount.toLocaleString("en-IN")}`);
                doc.text(`UPI: ₹${summary.upiAmount.toLocaleString("en-IN")}`);
                doc.text(`Card: ₹${summary.cardAmount.toLocaleString("en-IN")}`);

                doc.moveDown();

                // Fuel-wise
                doc.fontSize(12)
                    .font("Helvetica-Bold")
                    .text("FUEL-WISE SUMMARY");
                doc.moveDown(0.5);

                Object.keys(summary.fuelWise || {}).forEach((fuel) => {
                    const fuelData = summary.fuelWise[fuel];
                    doc.fontSize(10)
                        .font("Helvetica")
                        .text(
                            `${fuel}: ${fuelData.liters}L = ₹${fuelData.amount.toLocaleString(
                                "en-IN"
                            )}`
                        );
                });

                doc.end();

                stream.on("finish", () => {
                    resolve(filePath);
                });

                stream.on("error", (err) => {
                    reject(err);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFService;
