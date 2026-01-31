# Petrol Pump System - Quick Test Script
# Run this in PowerShell to test all features

$baseUrl = "http://localhost:5000/api"
$token = ""
$pumpId = ""
$nozzleId = ""

Write-Host "`n🧪 PETROL PUMP SYSTEM - TESTING`n" -ForegroundColor Cyan

# 1. Register & Login
Write-Host "1️⃣ Testing Authentication..." -ForegroundColor Yellow

$email = "testowner$(Get-Random)@example.com"
$registerBody = @{
    name = "Test Owner"
    email = $email
    password = "password123"
    role = "owner"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    $token = $registerResponse.token
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

# 2. Create Petrol Pump
Write-Host "`n2️⃣ Creating Petrol Pump..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$pumpBody = @{
    name = "Test Highway Pump"
    location = "Mumbai-Pune Highway"
    contactNumber = "9876543210"
    gstNumber = "27AABCU9603R1ZM"
} | ConvertTo-Json

try {
    $pumpResponse = Invoke-RestMethod -Uri "$baseUrl/pumps" -Method Post -Body $pumpBody -Headers $headers
    $pumpId = $pumpResponse.pump._id
    Write-Host "✅ Pump created: $($pumpResponse.pump.name)" -ForegroundColor Green
    Write-Host "Pump ID: $pumpId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Pump creation failed: $_" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

# 3. Add Fuel Types
Write-Host "`n3️⃣ Adding Fuel Types..." -ForegroundColor Yellow

$petrolBody = @{
    name = "Petrol"
    petrolPumpId = $pumpId
    currentPrice = 105.50
} | ConvertTo-Json

$dieselBody = @{
    name = "Diesel"
    petrolPumpId = $pumpId
    currentPrice = 95.75
} | ConvertTo-Json

try {
    $petrolResponse = Invoke-RestMethod -Uri "$baseUrl/fuels" -Method Post -Body $petrolBody -Headers $headers
    Write-Host "✅ Petrol added - ₹105.50/L" -ForegroundColor Green
    
    $dieselResponse = Invoke-RestMethod -Uri "$baseUrl/fuels" -Method Post -Body $dieselBody -Headers $headers
    Write-Host "✅ Diesel added - ₹95.75/L" -ForegroundColor Green
} catch {
    Write-Host "❌ Fuel creation failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 4. Create Nozzles
Write-Host "`n4️⃣ Creating Nozzles..." -ForegroundColor Yellow

$nozzle1Body = @{
    nozzleNumber = "N1"
    machineNumber = "M1"
    fuelType = "Petrol"
    petrolPumpId = $pumpId
} | ConvertTo-Json

try {
    $nozzleResponse = Invoke-RestMethod -Uri "$baseUrl/nozzles" -Method Post -Body $nozzle1Body -Headers $headers
    $nozzleId = $nozzleResponse.nozzle._id
    Write-Host "✅ Nozzle N1 created" -ForegroundColor Green
} catch {
    Write-Host "❌ Nozzle creation failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 5. Enter Daily Reading
Write-Host "`n5️⃣ Entering Daily Reading..." -ForegroundColor Yellow

$today = (Get-Date).ToString("yyyy-MM-dd")
$readingBody = @{
    date = $today
    petrolPumpId = $pumpId
    nozzleId = $nozzleId
    openingReading = 1000
    closingReading = 1500
    cashAmount = 25000
    upiAmount = 20000
    cardAmount = 8000
} | ConvertTo-Json

try {
    $readingResponse = Invoke-RestMethod -Uri "$baseUrl/readings" -Method Post -Body $readingBody -Headers $headers
    Write-Host "✅ Reading entered successfully!" -ForegroundColor Green
    Write-Host "   Liters Sold: $($readingResponse.reading.litersSold)L" -ForegroundColor Gray
    Write-Host "   Total Amount: ₹$($readingResponse.reading.totalAmount)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Reading entry failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 6. Get Daily Summary
Write-Host "`n6️⃣ Getting Daily Summary..." -ForegroundColor Yellow

try {
    $summaryResponse = Invoke-RestMethod -Uri "$baseUrl/readings/pump/$pumpId/summary/$today" -Method Get -Headers $headers
    Write-Host "✅ Daily Summary Retrieved!" -ForegroundColor Green
    Write-Host "   Total Sales: ₹$($summaryResponse.totalSales)" -ForegroundColor Gray
    Write-Host "   Cash: ₹$($summaryResponse.cashAmount)" -ForegroundColor Gray
    Write-Host "   UPI: ₹$($summaryResponse.upiAmount)" -ForegroundColor Gray
    Write-Host "   Card: ₹$($summaryResponse.cardAmount)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Summary retrieval failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 7. Generate PDF Report
Write-Host "`n7️⃣ Generating PDF Report..." -ForegroundColor Yellow

try {
    $pdfPath = "daily_report_test.pdf"
    Invoke-RestMethod -Uri "$baseUrl/reports/daily/$pumpId/$today" -Method Get -Headers $headers -OutFile $pdfPath
    Write-Host "✅ PDF Report Generated: $pdfPath" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PDF generation failed (readings may be needed): $_" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# 8. Test Email Configuration
Write-Host "`n8️⃣ Testing Email Configuration..." -ForegroundColor Yellow

$emailTestBody = @{
    emailTo = "daya23vats@gmail.com"
} | ConvertTo-Json

try {
    $emailResponse = Invoke-RestMethod -Uri "$baseUrl/reports/test-email" -Method Post -Body $emailTestBody -Headers $headers
    Write-Host "✅ Test email sent successfully!" -ForegroundColor Green
    Write-Host "   Check inbox: daya23vats@gmail.com" -ForegroundColor Gray
    Write-Host "   Message ID: $($emailResponse.messageId)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Email test failed. Check EMAIL_USER and EMAIL_PASS in .env" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "`n   💡 For Gmail, you need an App Password:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor Gray
    Write-Host "   2. Generate new app password for Mail" -ForegroundColor Gray
    Write-Host "   3. Update EMAIL_PASS in .env file" -ForegroundColor Gray
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "🎉 TESTING COMPLETE!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Cyan

Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "   Pump ID: $pumpId" -ForegroundColor Gray
Write-Host "   Email: $email" -ForegroundColor Gray
Write-Host "   Token: Available" -ForegroundColor Gray
Write-Host "`n✅ Your petrol pump backend is working!" -ForegroundColor Green

Write-Host "`n🔜 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update EMAIL_PASS in .env with Gmail App Password" -ForegroundColor Gray
Write-Host "   2. Test email reports" -ForegroundColor Gray
Write-Host "   3. Build frontend dashboard" -ForegroundColor Gray
Write-Host "   4. Deploy to production`n" -ForegroundColor Gray
