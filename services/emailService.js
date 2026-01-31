const nodemailer = require("nodemailer");

class EmailService {
    constructor() {
        // Create transporter with Gmail SMTP
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Use App Password for Gmail
            },
        });
    }

    /**
     * Send daily report email with PDF attachment
     * @param {Object} options - Email options
     * @returns {Promise}
     */
    async sendDailyReport(options) {
        const { to, pumpName, date, pdfPath, summary } = options;

        const mailOptions = {
            from: `"Petrol Pump Reports" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `Daily Sales Report - ${pumpName} - ${new Date(
                date
            ).toLocaleDateString("en-IN")}`,
            html: this.generateDailyEmailHTML(pumpName, date, summary),
            attachments: [
                {
                    filename: `daily_report_${
                        new Date(date).toISOString().split("T")[0]
                    }.pdf`,
                    path: pdfPath,
                },
            ],
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("✅ Email sent:", info.messageId);
            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error("❌ Email error:", error);
            throw error;
        }
    }

    /**
     * Send monthly report email
     */
    async sendMonthlyReport(options) {
        const { to, pumpName, month, year, pdfPath, summary } = options;

        const mailOptions = {
            from: `"Petrol Pump Reports" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `Monthly Sales Report - ${pumpName} - ${month}/${year}`,
            html: this.generateMonthlyEmailHTML(pumpName, month, year, summary),
            attachments: [
                {
                    filename: `monthly_report_${year}_${month}.pdf`,
                    path: pdfPath,
                },
            ],
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("✅ Monthly email sent:", info.messageId);
            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error("❌ Email error:", error);
            throw error;
        }
    }

    /**
     * Send test email
     */
    async sendTestEmail(to) {
        const mailOptions = {
            from: `"Petrol Pump System" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: "Test Email - Petrol Pump System",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">✅ Email Configuration Successful!</h2>
                    <p>Your petrol pump system is now configured to send automated reports.</p>
                    <p style="color: #666; font-size: 14px;">
                        This is a test email to verify your SMTP settings are working correctly.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Sent from Petrol Pump Management System
                    </p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate HTML for daily report email
     */
    generateDailyEmailHTML(pumpName, date, summary) {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0; }
        .info { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .summary { margin: 20px 0; }
        .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #059669; font-weight: bold; }
        .fuel-breakdown { background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .fuel-item { padding: 8px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Daily Sales Report</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">${pumpName}</p>
        </div>

        <div class="info">
            <p style="margin: 0;"><strong>Date:</strong> ${new Date(
                date
            ).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })}</p>
            <p style="margin: 5px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleString(
                "en-IN"
            )}</p>
        </div>

        <div class="summary">
            <h2 style="color: #1e40af;">Sales Summary</h2>
            
            <div class="summary-item">
                <span class="label">Total Sales:</span>
                <span class="value">₹${summary.totalSales.toLocaleString("en-IN")}</span>
            </div>
            
            <div class="summary-item">
                <span class="label">Cash Amount:</span>
                <span class="value">₹${summary.cashAmount.toLocaleString("en-IN")}</span>
            </div>
            
            <div class="summary-item">
                <span class="label">UPI Amount:</span>
                <span class="value">₹${summary.upiAmount.toLocaleString("en-IN")}</span>
            </div>
            
            <div class="summary-item" style="border-bottom: none;">
                <span class="label">Card Amount:</span>
                <span class="value">₹${summary.cardAmount.toLocaleString("en-IN")}</span>
            </div>
        </div>

        <div class="fuel-breakdown">
            <h3 style="color: #065f46; margin-top: 0;">⛽ Fuel-wise Breakdown</h3>
            ${Object.keys(summary.fuelWise || {})
                .map(
                    (fuel) => `
                <div class="fuel-item">
                    <strong>${fuel}:</strong> ${summary.fuelWise[
                        fuel
                    ].litersSold.toLocaleString("en-IN")} Liters = 
                    ₹${summary.fuelWise[fuel].amount.toLocaleString("en-IN")}
                </div>
            `
                )
                .join("")}
        </div>

        <p style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            📎 <strong>Detailed PDF report is attached.</strong> Please review the nozzle-wise readings and stock information.
        </p>

        <div class="footer">
            <p>This is an automated email from your Petrol Pump Management System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Generate HTML for monthly report email
     */
    generateMonthlyEmailHTML(pumpName, month, year, summary) {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #6d28d9; margin: 0; }
        .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #7c3aed; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 Monthly Sales Report</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">${pumpName}</p>
        </div>

        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Period:</strong> ${month}/${year}</p>
            <p style="margin: 5px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleString(
                "en-IN"
            )}</p>
        </div>

        <div>
            <h2 style="color: #6d28d9;">Monthly Summary</h2>
            
            <div class="summary-item">
                <span class="label">Total Sales:</span>
                <span class="value">₹${summary.totalSales.toLocaleString("en-IN")}</span>
            </div>
            
            <div class="summary-item">
                <span class="label">Total Liters:</span>
                <span class="value">${summary.totalLiters.toLocaleString("en-IN")} L</span>
            </div>
            
            <div class="summary-item" style="border-bottom: none;">
                <span class="label">Average Daily Sales:</span>
                <span class="value">₹${Math.round(
                    summary.totalSales / 30
                ).toLocaleString("en-IN")}</span>
            </div>
        </div>

        <p style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 20px;">
            📎 <strong>Detailed PDF report is attached.</strong>
        </p>

        <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>This is an automated email from your Petrol Pump Management System.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}

module.exports = new EmailService();
