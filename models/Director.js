const mongoose = require("mongoose");

const DirectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  qualification: { type: String },
  experience: { type: String },
  message: { type: String },
  image: { type: String },
  order_num: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Director", DirectorSchema);
