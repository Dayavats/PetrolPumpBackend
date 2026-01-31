const mongoose = require("mongoose");

const fuelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: ["Petrol", "Diesel", "CNG"], // Add more as needed
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
        currentPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        priceHistory: [
            {
                price: { type: Number, required: true },
                effectiveDate: { type: Date, required: true },
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Ensure unique fuel type per pump
fuelSchema.index({ name: 1, petrolPump: 1 }, { unique: true });

module.exports = mongoose.model("Fuel", fuelSchema);
