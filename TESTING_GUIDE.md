# 🧪 Petrol Pump API - Quick Test Guide

## ✅ Prerequisites
- Server running on http://localhost:5000
- MongoDB connected

## 📝 Step-by-Step Testing

### 1️⃣ Register Owner
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Owner\",\"email\":\"owner1@example.com\",\"password\":\"password123\",\"role\":\"owner\"}"
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Test Owner",
    "email": "owner1@example.com",
    "role": "owner"
  }
}
```

**💡 Copy the token** - You'll need it for all other requests!

---

### 2️⃣ Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"owner1@example.com\",\"password\":\"password123\"}"
```

---

### 3️⃣ Create Petrol Pump
Replace `YOUR_TOKEN` with the token from step 1:

```bash
curl -X POST http://localhost:5000/api/pumps ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\":\"Highway Petrol Pump\",\"location\":\"Mumbai-Pune Highway\",\"contactNumber\":\"9876543210\",\"gstNumber\":\"27AABCU9603R1ZM\"}"
```

**Expected Response:**
```json
{
  "message": "Petrol pump created",
  "pump": {
    "_id": "...",  // ← COPY THIS PUMP ID
    "name": "Highway Petrol Pump",
    "location": "Mumbai-Pune Highway"
  }
}
```

**💡 Save the pump `_id`** - You'll use it in next steps!

---

### 4️⃣ Add Fuel Types

**Add Petrol:**
```bash
curl -X POST http://localhost:5000/api/fuels ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\":\"Petrol\",\"petrolPumpId\":\"YOUR_PUMP_ID\",\"currentPrice\":105.50}"
```

**Add Diesel:**
```bash
curl -X POST http://localhost:5000/api/fuels ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\":\"Diesel\",\"petrolPumpId\":\"YOUR_PUMP_ID\",\"currentPrice\":95.75}"
```

**💡 Save the fuel `_id` for each**

---

### 5️⃣ Create Nozzles

**Nozzle 1 - Petrol:**
```bash
curl -X POST http://localhost:5000/api/nozzles ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"nozzleNumber\":\"N1\",\"machineNumber\":\"M1\",\"fuelType\":\"Petrol\",\"petrolPumpId\":\"YOUR_PUMP_ID\"}"
```

**Nozzle 2 - Petrol:**
```bash
curl -X POST http://localhost:5000/api/nozzles ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"nozzleNumber\":\"N2\",\"machineNumber\":\"M1\",\"fuelType\":\"Petrol\",\"petrolPumpId\":\"YOUR_PUMP_ID\"}"
```

**Nozzle 3 - Diesel:**
```bash
curl -X POST http://localhost:5000/api/nozzles ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"nozzleNumber\":\"N3\",\"machineNumber\":\"M2\",\"fuelType\":\"Diesel\",\"petrolPumpId\":\"YOUR_PUMP_ID\"}"
```

**💡 Save nozzle IDs**

---

### 6️⃣ Add Employees

**Create Operator:**
```bash
curl -X POST http://localhost:5000/api/employees ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\":\"Ravi Kumar\",\"phone\":\"9988776655\",\"role\":\"operator\",\"salary\":15000,\"petrolPumpId\":\"YOUR_PUMP_ID\"}"
```

**Create Manager:**
```bash
curl -X POST http://localhost:5000/api/employees ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"name\":\"Suresh Sharma\",\"phone\":\"9988776656\",\"role\":\"manager\",\"salary\":25000,\"petrolPumpId\":\"YOUR_PUMP_ID\"}"
```

---

### 7️⃣ Enter Daily Readings

**Reading for Nozzle 1:**
```bash
curl -X POST http://localhost:5000/api/readings ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"date\":\"2026-01-31\",\"petrolPumpId\":\"YOUR_PUMP_ID\",\"nozzleId\":\"YOUR_NOZZLE_1_ID\",\"openingReading\":1000,\"closingReading\":1500,\"cashAmount\":25000,\"upiAmount\":20000,\"cardAmount\":8000}"
```

**Expected Response:**
```json
{
  "message": "Daily reading created",
  "reading": {
    "litersSold": 500,      // ← Auto-calculated!
    "totalAmount": 52750,   // ← 500L × ₹105.50
    "cashAmount": 25000,
    "upiAmount": 20000,
    "cardAmount": 8000
  }
}
```

---

### 8️⃣ Get Daily Summary

```bash
curl -X GET "http://localhost:5000/api/readings/pump/YOUR_PUMP_ID/summary/2026-01-31" ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "date": "2026-01-31T00:00:00.000Z",
  "totalSales": 52750,
  "cashAmount": 25000,
  "upiAmount": 20000,
  "cardAmount": 8000,
  "fuelWise": {
    "Petrol": {
      "litersSold": 500,
      "amount": 52750
    }
  }
}
```

---

### 9️⃣ Create Stock Entry

```bash
curl -X POST http://localhost:5000/api/stock ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"date\":\"2026-01-31\",\"petrolPumpId\":\"YOUR_PUMP_ID\",\"fuelType\":\"Petrol\",\"openingStock\":5000,\"purchasedStock\":2000,\"purchaseDetails\":[{\"quantity\":2000,\"pricePerLiter\":98.50,\"totalCost\":197000,\"supplier\":\"Indian Oil\",\"invoiceNumber\":\"INV-001\",\"purchaseDate\":\"2026-01-31\"}]}"
```

**Expected Response:**
```json
{
  "message": "Stock entry created",
  "stock": {
    "openingStock": 5000,
    "purchasedStock": 2000,
    "totalAvailable": 7000,     // ← Auto-calculated!
    "soldStock": 500,            // ← From daily readings!
    "closingStock": 6500,        // ← Auto-calculated!
    "variance": 6500
  }
}
```

---

### 🔟 Get Date Range Report

```bash
curl -X GET "http://localhost:5000/api/readings/pump/YOUR_PUMP_ID/report?startDate=2026-01-01&endDate=2026-01-31" ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Quick Reference

### All Your Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register owner |
| POST | `/api/auth/login` | Login |
| POST | `/api/pumps` | Create pump |
| GET | `/api/pumps` | Get my pumps |
| POST | `/api/fuels` | Add fuel type |
| GET | `/api/fuels/pump/:pumpId` | Get fuels |
| PUT | `/api/fuels/:fuelId/price` | Update price |
| POST | `/api/nozzles` | Create nozzle |
| GET | `/api/nozzles/pump/:pumpId` | Get nozzles |
| PUT | `/api/nozzles/:nozzleId/assign` | Assign employee |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/pump/:pumpId` | Get employees |
| PUT | `/api/employees/:employeeId` | Update employee |
| POST | `/api/readings` | Enter reading |
| GET | `/api/readings/pump/:pumpId/date/:date` | Get readings |
| GET | `/api/readings/pump/:pumpId/summary/:date` | Daily summary |
| GET | `/api/readings/pump/:pumpId/report` | Date range report |
| POST | `/api/stock` | Create stock |
| GET | `/api/stock/pump/:pumpId/date/:date` | Get stock |
| PUT | `/api/stock/:stockId/purchase` | Add purchase |
| PUT | `/api/stock/:stockId/sync` | Sync with readings |

---

## ✅ Success Indicators

If you see these, you're good to go:

1. ✅ Register returns a token
2. ✅ Login works
3. ✅ Pump created with ID
4. ✅ Fuels added for pump
5. ✅ Nozzles created
6. ✅ Employees added
7. ✅ Readings auto-calculate liters & amount
8. ✅ Summary shows total sales
9. ✅ Stock auto-syncs with readings

---

## 🎉 You're Done!

Your petrol pump backend is **production-ready** for Phase 1!

Next steps:
- Add PDF generation
- Add email automation
- Build frontend dashboard
- Deploy to production

💪 Great work!