const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingRef: {
    type: String,
    required: true,
    unique: true,
  },
  showId: {
    type: Number,
    required: true,
  },
  seatId: {
    type: String,
    default: null,
  },
  seatIds: {
    type: [String],
    default: [],
  },
  seats: {
    type: [{
      id: String,
      seatId: String,
      label: String,
      row: String,
      column: Number,
      number: Number,
      tier: String,
      price: Number,
      _id: false,
    }],
    default: [],
  },
  amount: {
    type: Number,
    required: true,
  },
  phone: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: [
      'HELD',
      'OTP_VERIFIED',
      'PAYMENT_PENDING',
      'CONFIRMED',
      'PAYMENT_FAILED',
      'EXPIRED',
      'CANCELLED',
    ],
    default: 'HELD',
  },
  paymentId: {
    type: String,
    default: null,
  },
  gatewayEventId: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'],
    default: 'NONE',
  },
  holdExpiresAt: {
    type: Date,
    required: true,
  },
  movieId: Number,
  movieTitle: String,
  moviePoster: String,
  theatre: String,
  showTime: String,
  showDate: String,
  verificationToken: {
    type: String,
    default: null,
  },
  refundStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'SUCCEEDED', 'FAILED'],
    default: 'NONE',
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
