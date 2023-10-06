const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const savedSchema = new Schema({
  image: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("saved-images", savedSchema);
