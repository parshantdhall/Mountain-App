var mongoose = require("mongoose");

var logoSchema = new mongoose.Schema({
    name: String
});

module.exports = mongoose.model("Logo", logoSchema);