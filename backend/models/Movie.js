const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  id: Number,
  name: String,
  releaseDate: Date,
  poster: String,
  shows: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Show' }]
});

module.exports = mongoose.model('Movie', movieSchema);
