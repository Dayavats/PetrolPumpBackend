const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const employeeRoutes = require("./routes/employeeRoutes");
const fuelRoutes = require("./routes/fuelRoutes");
const nozzleRoutes = require("./routes/nozzleRoutes");
const dailyReadingRoutes = require("./routes/dailyReadingRoutes");
const stockRoutes = require("./routes/stockRoutes");
const reportRoutes = require("./routes/reportRoutes");
const CronService = require("./services/cronService");

dotenv.config();

const app = express();

// CORS configuration for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// 👇 THIS MUST RUN BEFORE ROUTES
connectDB();

// Initialize cron jobs for automated reports
CronService.init();

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/pumps", require("./routes/petrolpump.routes"));
app.use("/api/employees", employeeRoutes);
app.use("/api/fuels", fuelRoutes);
app.use("/api/nozzles", nozzleRoutes);
app.use("/api/readings", dailyReadingRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/reports", reportRoutes);



const PORT = 5000;
app.listen(PORT, () => {
  console.log("Server running on port 5000");
});
