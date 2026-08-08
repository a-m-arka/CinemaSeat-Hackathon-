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
    required: true,
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
    ],
    default: 'HELD',
  },
  paymentId: {
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
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
