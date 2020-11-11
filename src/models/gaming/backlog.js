const mongoose = require("mongoose");

let backlogSchema = new mongoose.Schema({
  name: String,
  started: Boolean,
  platinumCandidate: Boolean,
  completed: Boolean,
  completedDate: Date,
  platinum: Boolean,
  platinumDate: Date,
  cancelled: Boolean,
  cancelledDate: Date
});
module.exports = mongoose.model("Backlog", backlogSchema);
