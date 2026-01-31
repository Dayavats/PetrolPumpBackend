const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
let token = "";
let pumpId = "";
let fuelIds = {};
let nozzleIds = [];
let employeeId = "";

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

function log(message, color = "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
    console.log("\n" + "=".repeat(60));
    log(`  ${title}`, "cyan");
    console.log("=".repeat(60) + "\n");
}

async function test() {
    try {
        section("🔐 STEP 1: AUTHENTICATION");

        // Register new user
        const testEmail = `test${Date.now()}@example.com`;
        try {
            log("📝 Registering new owner...", "yellow");
            const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
                name: "Test Owner",
                email: testEmail,
                password: "password123",
                role: "owner",
            });
            log("✅ Owner registered successfully", "green");
            console.log(`Email: ${testEmail}`);
        } catch (error) {
            log("⚠️  User may already exist, trying login...", "yellow");
        }

        // Login
        log("\n🔑 Logging in...", "yellow");
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testEmail,
            password: "password123",
        });

        token = loginRes.data.token;
        log("✅ Login successful! Token received", "green");
        console.log("Token:", token.substring(0, 30) + "...");

        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };

        section("⛽ STEP 2: CREATE PETROL PUMP");

        log("🏗️  Creating petrol pump...", "yellow");
        const pumpRes = await axios.post(
            `${BASE_URL}/pumps`,
            {
                name: "Test Petrol Pump",
                location: "Test Highway, Test City",
                contactNumber: "9876543210",
                gstNumber: "27AABCU9603R1ZM",
            },
            config
        );
        pumpId = pumpRes.data.pump._id;
        log("✅ Petrol pump created successfully!", "green");
        console.log("Pump ID:", pumpId);
        console.log("Pump Name:", pumpRes.data.pump.name);

        section("🛢️  STEP 3: ADD FUEL TYPES");

        log("⚡ Adding Petrol...", "yellow");
        const petrolRes = await axios.post(
            `${BASE_URL}/fuels`,
            {
                name: "Petrol",
                petrolPumpId: pumpId,
                currentPrice: 105.5,
            },
            config
        );
        fuelIds.petrol = petrolRes.data.fuel._id;
        log("✅ Petrol added - ₹105.50/L", "green");

        log("\n⚡ Adding Diesel...", "yellow");
        const dieselRes = await axios.post(
            `${BASE_URL}/fuels`,
            {
                name: "Diesel",
                petrolPumpId: pumpId,
                currentPrice: 95.75,
            },
            config
        );
        fuelIds.diesel = dieselRes.data.fuel._id;
        log("✅ Diesel added - ₹95.75/L", "green");

        log("\n📋 Fetching all fuels...", "yellow");
        const fuelsRes = await axios.get(`${BASE_URL}/fuels/pump/${pumpId}`, config);
        console.log(`Found ${fuelsRes.data.length} fuel types`);

        section("🔧 STEP 4: CREATE NOZZLES");

        const nozzles = [
            { number: "N1", machine: "M1", fuel: "Petrol" },
            { number: "N2", machine: "M1", fuel: "Petrol" },
            { number: "N3", machine: "M2", fuel: "Diesel" },
            { number: "N4", machine: "M2", fuel: "Diesel" },
        ];

        for (const nozzle of nozzles) {
            log(`🔩 Creating ${nozzle.number} (${nozzle.fuel})...`, "yellow");
            const nozzleRes = await axios.post(
                `${BASE_URL}/nozzles`,
                {
                    nozzleNumber: nozzle.number,
                    machineNumber: nozzle.machine,
                    fuelType: nozzle.fuel,
                    petrolPumpId: pumpId,
                },
                config
            );
            nozzleIds.push(nozzleRes.data.nozzle._id);
            log(`✅ ${nozzle.number} created`, "green");
        }

        log(`\n📋 Total nozzles created: ${nozzleIds.length}`, "green");

        section("👷 STEP 5: ADD EMPLOYEES");

        log("👤 Creating operator...", "yellow");
        const empRes = await axios.post(
            `${BASE_URL}/employees`,
            {
                name: "Ravi Kumar",
                phone: "9988776655",
                role: "operator",
                salary: 15000,
                petrolPumpId: pumpId,
            },
            config
        );
        employeeId = empRes.data.employee._id;
        log("✅ Operator created - Ravi Kumar", "green");

        log("\n👤 Creating manager...", "yellow");
        await axios.post(
            `${BASE_URL}/employees`,
            {
                name: "Suresh Sharma",
                phone: "9988776656",
                role: "manager",
                salary: 25000,
                petrolPumpId: pumpId,
            },
            config
        );
        log("✅ Manager created - Suresh Sharma", "green");

        log("\n🔗 Assigning employee to nozzle...", "yellow");
        await axios.put(
            `${BASE_URL}/nozzles/${nozzleIds[0]}/assign`,
            { employeeId },
            config
        );
        log("✅ Employee assigned to N1", "green");

        section("📊 STEP 6: ENTER DAILY READINGS");

        const today = new Date().toISOString().split("T")[0];

        log(`📝 Entering reading for Nozzle 1 (${today})...`, "yellow");
        const reading1 = await axios.post(
            `${BASE_URL}/readings`,
            {
                date: today,
                petrolPumpId: pumpId,
                nozzleId: nozzleIds[0],
                openingReading: 1000,
                closingReading: 1500,
                cashAmount: 25000,
                upiAmount: 20000,
                cardAmount: 8000,
            },
            config
        );
        log("✅ Reading entered", "green");
        log(
            `   Liters sold: ${reading1.data.reading.litersSold}L | Amount: ₹${reading1.data.reading.totalAmount}`,
            "blue"
        );

        log(`\n📝 Entering reading for Nozzle 2...`, "yellow");
        const reading2 = await axios.post(
            `${BASE_URL}/readings`,
            {
                date: today,
                petrolPumpId: pumpId,
                nozzleId: nozzleIds[1],
                openingReading: 2000,
                closingReading: 2300,
                cashAmount: 15000,
                upiAmount: 15000,
                cardAmount: 2000,
            },
            config
        );
        log("✅ Reading entered", "green");
        log(
            `   Liters sold: ${reading2.data.reading.litersSold}L | Amount: ₹${reading2.data.reading.totalAmount}`,
            "blue"
        );

        log(`\n📋 Fetching daily summary...`, "yellow");
        const summaryRes = await axios.get(
            `${BASE_URL}/readings/pump/${pumpId}/summary/${today}`,
            config
        );
        log("✅ Daily Summary:", "green");
        console.log(`   Total Sales: ₹${summaryRes.data.totalSales}`);
        console.log(`   Cash: ₹${summaryRes.data.cashAmount}`);
        console.log(`   UPI: ₹${summaryRes.data.upiAmount}`);
        console.log(`   Card: ₹${summaryRes.data.cardAmount}`);
        console.log("   Fuel-wise:");
        Object.keys(summaryRes.data.fuelWise).forEach((fuel) => {
            console.log(
                `     ${fuel}: ${summaryRes.data.fuelWise[fuel].litersSold}L = ₹${summaryRes.data.fuelWise[fuel].amount}`
            );
        });

        section("📦 STEP 7: MANAGE STOCK");

        log(`📝 Creating stock entry for Petrol...`, "yellow");
        const stockRes = await axios.post(
            `${BASE_URL}/stock`,
            {
                date: today,
                petrolPumpId: pumpId,
                fuelType: "Petrol",
                openingStock: 5000,
                purchasedStock: 2000,
                purchaseDetails: [
                    {
                        quantity: 2000,
                        pricePerLiter: 98.5,
                        totalCost: 197000,
                        supplier: "Indian Oil",
                        invoiceNumber: "INV-2024-001",
                        purchaseDate: today,
                    },
                ],
            },
            config
        );
        log("✅ Stock entry created", "green");
        log(
            `   Opening: ${stockRes.data.stock.openingStock}L | Purchased: ${stockRes.data.stock.purchasedStock}L`,
            "blue"
        );
        log(
            `   Sold: ${stockRes.data.stock.soldStock}L | Closing: ${stockRes.data.stock.closingStock}L`,
            "blue"
        );

        section("📈 STEP 8: GENERATE REPORTS");

        log(`📊 Getting date range report...`, "yellow");
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
        const reportRes = await axios.get(
            `${BASE_URL}/readings/pump/${pumpId}/report?startDate=${startDate}&endDate=${today}`,
            config
        );
        log("✅ Report generated", "green");
        console.log(`   Period: ${startDate} to ${today}`);
        console.log(`   Total Entries: ${reportRes.data.readings.length}`);
        console.log(`   Total Liters: ${reportRes.data.totals.totalLiters}L`);
        console.log(`   Total Amount: ₹${reportRes.data.totals.totalAmount}`);

        section("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");

        log("\n✅ Summary:", "green");
        console.log(`   Pump ID: ${pumpId}`);
        console.log(`   Fuels: ${Object.keys(fuelIds).length}`);
        console.log(`   Nozzles: ${nozzleIds.length}`);
        console.log(`   Employees: 2`);
        console.log(`   Daily Readings: 2`);
        console.log(`   Stock Entries: 1`);

        log("\n🚀 Your petrol pump backend is working perfectly!", "cyan");
        log(
            "💡 You can now build the frontend or add PDF/Email features.",
            "yellow"
        );
    } catch (error) {
        log("\n❌ ERROR OCCURRED:", "red");
        console.error(error.response?.data || error.message);
        console.error("\nFull error:", error);
    }
}

// Run tests
console.log("\n");
log("🧪 PETROL PUMP SYSTEM - API TESTING", "cyan");
log("====================================\n", "cyan");

test();
