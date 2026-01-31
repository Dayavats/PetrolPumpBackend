const mongoose = require("mongoose");

const PetrolPumpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    registrationNumber: {
      type: String,
    },
    owners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PetrolPump", PetrolPumpSchema);
