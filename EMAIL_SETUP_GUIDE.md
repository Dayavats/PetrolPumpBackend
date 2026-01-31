# 📧 Email & Automated Reports Setup Guide

## ✅ What's Been Added

Your petrol pump system now has:

### 1. **PDF Report Generation**
- Daily sales reports with nozzle-wise readings
- Monthly summary reports
- Professional formatting with tables and charts
- Automatic calculations

### 2. **Email Automation**
- Send reports via email with PDF attachments
- Beautiful HTML email templates
- Support for Gmail SMTP

### 3. **Cron Jobs (Automated Scheduling)**
- **Daily reports**: Automatically sent every day at 11:59 PM
- **Monthly reports**: Sent on 1st of every month at 9:00 AM
- All pump owners receive their reports automatically

---

## 🔧 Email Configuration (Gmail Setup)

### Step 1: Get Gmail App Password

1. Go to your **Google Account**: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Search for "**App passwords**" 
5. Click **App passwords**
6. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Enter "Petrol Pump System"
7. Click **Generate**
8. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update .env File

Open `.env` and update:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop     # Your 16-char app password (no spaces)
```

**Example:**
```env
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=xyzw1234abcd5678
```

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
node server.js
```

You should see:
```
✅ MongoDB connected
🕒 Initializing cron jobs...
✅ Daily report scheduled for 11:59 PM
✅ Monthly report scheduled for 1st of every month at 9:00 AM
✅ Cron jobs initialized
Server running on port 5000
```

---

## 📡 New API Endpoints

### 1. Test Email Configuration

**POST** `/api/reports/test-email`

```bash
curl -X POST http://localhost:5000/api/reports/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"emailTo\":\"recipient@example.com\"}"
```

**Response:**
```json
{
  "message": "Test email sent successfully",
  "recipient": "recipient@example.com",
  "messageId": "<...@gmail.com>"
}
```

---

### 2. Generate & Download Daily Report PDF

**GET** `/api/reports/daily/:pumpId/:date`

```bash
curl -X GET "http://localhost:5000/api/reports/daily/YOUR_PUMP_ID/2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output daily_report.pdf
```

**Result**: Downloads PDF file

---

### 3. Generate & Email Daily Report

**POST** `/api/reports/daily/:pumpId/:date/email`

```bash
curl -X POST "http://localhost:5000/api/reports/daily/YOUR_PUMP_ID/2026-01-31/email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"emailTo\":\"owner@example.com\"}"
```

**Response:**
```json
{
  "message": "Report emailed successfully",
  "emailSent": true,
  "recipient": "owner@example.com",
  "messageId": "<...@gmail.com>"
}
```

---

### 4. Generate Monthly Report PDF

**GET** `/api/reports/monthly/:pumpId/:year/:month`

```bash
curl -X GET "http://localhost:5000/api/reports/monthly/YOUR_PUMP_ID/2026/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output monthly_report.pdf
```

---

## 🕒 Automated Cron Jobs

### Daily Reports (11:59 PM Every Day)

**What happens:**
1. System fetches all readings for today
2. Generates PDF report for each pump
3. Emails report to all pump owners automatically
4. Logs activity in console

**Customize timing:**
Edit `services/cronService.js`, line 24:
```javascript
cron.schedule("59 23 * * *", async () => {
    // Your code
});
```

**Cron format:**
- `59 23 * * *` = 11:59 PM every day
- `0 22 * * *` = 10:00 PM every day
- `30 20 * * *` = 8:30 PM every day

### Monthly Reports (1st of Month, 9:00 AM)

**What happens:**
1. On 1st of every month at 9:00 AM
2. Generates summary for previous month
3. Emails to all owners

**Customize:**
Edit `services/cronService.js`, line 126:
```javascript
cron.schedule("0 9 1 * *", async () => {
    // Your code
});
```

---

## 🧪 Testing Steps

### Test 1: Email Configuration

```bash
# Replace YOUR_TOKEN and YOUR_EMAIL
curl -X POST http://localhost:5000/api/reports/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"emailTo\":\"YOUR_EMAIL@gmail.com\"}"
```

**Expected:** You receive a test email within 10 seconds.

---

### Test 2: Generate Daily Report PDF

1. Ensure you have readings for today
2. Run:

```bash
curl -X GET "http://localhost:5000/api/reports/daily/YOUR_PUMP_ID/2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test_report.pdf
```

3. Open `test_report.pdf` - should show:
   - Pump details
   - Sales summary
   - Nozzle-wise readings table
   - Stock information

---

### Test 3: Email Daily Report

```bash
curl -X POST "http://localhost:5000/api/reports/daily/YOUR_PUMP_ID/2026-01-31/email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Expected:** Email arrives with PDF attachment.

---

### Test 4: Trigger Manual Cron Job (Optional)

Add this route temporarily to `reportRoutes.js`:

```javascript
router.post("/trigger-daily/:pumpId", authMiddleware, async (req, res) => {
    try {
        const { pumpId } = req.params;
        const { date } = req.body;
        
        const CronService = require("../services/cronService");
        const results = await CronService.triggerDailyReport(pumpId, date);
        
        res.json({ message: "Report sent", results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## 📂 Generated Files

All PDFs are saved in:
```
petrolpumpbackend/
  reports/
    daily_report_20260131.pdf
    daily_report_20260201.pdf
    monthly_report_2026_1.pdf
    ...
```

---

## 🚨 Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution:**
- Make sure you're using **App Password**, not regular Gmail password
- Ensure 2-Step Verification is enabled
- Double-check EMAIL_USER matches the email that generated the app password

---

### Error: "ECONNREFUSED"

**Solution:**
- Check your internet connection
- Gmail SMTP may be blocked by firewall
- Try using a different email provider (Outlook, SendGrid)

---

### No emails received

**Check:**
1. Look in **Spam/Junk** folder
2. Verify EMAIL_USER is correct
3. Run test-email endpoint first
4. Check server logs for errors

---

### Emails arrive but PDF is missing

**Check:**
- Ensure readings exist for that date
- Check `reports/` folder was created
- Look for errors in server console

---

## 📋 Quick Reference

| Feature | Endpoint | Method | Auth |
|---------|----------|--------|------|
| Test email | `/api/reports/test-email` | POST | ✅ |
| Daily PDF | `/api/reports/daily/:pumpId/:date` | GET | ✅ |
| Email daily | `/api/reports/daily/:pumpId/:date/email` | POST | ✅ |
| Monthly PDF | `/api/reports/monthly/:pumpId/:year/:month` | GET | ✅ |

---

## 🎉 What's Automated

✅ **Every day at 11:59 PM:**
- Fetch today's readings
- Generate PDF for each pump
- Email to all owners
- Zero manual work required!

✅ **1st of every month at 9:00 AM:**
- Generate last month's summary
- Email to all owners
- Complete monthly analytics

---

## 🔐 Security Notes

- **Never commit `.env` to Git**
- Keep your App Password secret
- Use environment variables in production
- Consider using dedicated email service (SendGrid, AWS SES) for production

---

## 🚀 Production Deployment

For production, use dedicated email service:

### Option 1: SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_api_key
```

### Option 2: AWS SES
```env
EMAIL_SERVICE=aws-ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
```

---

## ✅ Success Checklist

- [x] PDF service created
- [x] Email service configured
- [x] Cron jobs initialized
- [x] Routes added to server
- [ ] Email credentials configured
- [ ] Test email sent successfully
- [ ] Daily report PDF generated
- [ ] Daily report emailed successfully
- [ ] Cron jobs running (wait for 11:59 PM or test manually)

---

**You now have a fully automated petrol pump reporting system! 🎉**

Next steps:
- Build frontend dashboard
- Add more report types
- Implement validation & error handling
- Deploy to production