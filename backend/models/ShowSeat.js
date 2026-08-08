const mongoose = require('mongoose');

const showSeatSchema = new mongoose.Schema({
  showId: {
    type: Number,
    required: true,
  },
  seatId: {
    type: String,
    required: true,
  },
  row: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'HELD', 'BOOKED'],
    default: 'AVAILABLE',
  },
  bookingRef: {
    type: String,
    default: null,
  },
  holdExpiresAt: {
    type: Date,
    default: null,
  },
});

showSeatSchema.index({ showId: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model('ShowSeat', showSeatSchema);
