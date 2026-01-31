const mongoose = require("mongoose");

const nozzleSchema = new mongoose.Schema(
    {
        nozzleNumber: {
            type: String,
            required: true,
        },
        machineNumber: {
            type: String,
            required: true,
        },
        fuelType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Fuel",
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
        assignedEmployee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Ensure unique nozzle number per pump
nozzleSchema.index({ nozzleNumber: 1, petrolPump: 1 }, { unique: true });

module.exports = mongoose.model("Nozzle", nozzleSchema);
