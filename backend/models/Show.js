const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  id: Number,
  movieId: Number,
  movieName: String,
  theatreId: Number,
  theatreName: String,
  dateTime: Date,
  seatPlan: {
    type: Map,
    of: {
      type: Map,
      of: String
    }
  }
});

module.exports = mongoose.model('Show', showSchema);
