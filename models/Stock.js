const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
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
        fuelType: {
            type: String,
            required: true,
            enum: ["Petrol", "Diesel", "CNG"],
        },
        openingStock: {
            type: Number,
            required: true,
            min: 0,
        },
        purchasedStock: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAvailable: {
            type: Number,
            default: 0,
        },
        soldStock: {
            type: Number,
            default: 0,
        },
        closingStock: {
            type: Number,
            default: 0,
        },
        tankCapacity: {
            type: Number,
            default: 10000, // Default 10,000 liters
            min: 0,
        },
        variance: {
            type: Number,
            default: 0, // Difference between calculated and actual
        },
        purchaseDetails: [
            {
                quantity: { type: Number, required: true },
                pricePerLiter: { type: Number, required: true },
                totalCost: { type: Number, required: true },
                supplier: { type: String },
                invoiceNumber: { type: String },
                purchaseDate: { type: Date, required: true },
            },
        ],
        enteredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isLocked: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Calculate totals before saving
stockSchema.pre("save", function (next) {
    this.totalAvailable = this.openingStock + this.purchasedStock;
    this.closingStock = this.totalAvailable - this.soldStock;
    this.variance = this.closingStock; // Can be compared with physical measurement
    next();
});

// Ensure unique stock entry per fuel type per pump per date
stockSchema.index(
    { fuelType: 1, petrolPump: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model("Stock", stockSchema);
