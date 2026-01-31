const mongoose = require("mongoose");

const dailyReadingSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        petrolPump: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PetrolPump",
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        nozzle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Nozzle",
            required: true,
        },
        fuelType: {
            type: String,
            required: true,
            enum: ["Petrol", "Diesel", "CNG"],
        },
        openingReading: {
            type: Number,
            required: true,
            min: 0,
        },
        closingReading: {
            type: Number,
            required: true,
            min: 0,
        },
        litersSold: {
            type: Number,
            default: 0,
        },
        pricePerLiter: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            default: 0,
        },
        cashAmount: {
            type: Number,
            default: 0,
        },
        upiAmount: {
            type: Number,
            default: 0,
        },
        cardAmount: {
            type: Number,
            default: 0,
        },
        enteredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isLocked: {
            type: Boolean,
            default: false, // Once locked, can't be edited
        },
    },
    { timestamps: true }
);

// Calculate liters and amount before saving
dailyReadingSchema.pre("save", async function () {
    if (this.closingReading >= this.openingReading) {
        this.litersSold = this.closingReading - this.openingReading;
        this.totalAmount = this.litersSold * this.pricePerLiter;
    }
});

// Ensure unique reading per nozzle per date
dailyReadingSchema.index(
    { nozzle: 1, date: 1, petrolPump: 1 },
    { unique: true }
);

module.exports = mongoose.model("DailyReading", dailyReadingSchema);
