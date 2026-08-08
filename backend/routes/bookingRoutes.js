const express = require('express');
const { getBooking } = require('../controllers/bookingController');
const {
  sendBookingOtp,
  verifyBookingOtp,
  startBookingPayment,
  refundBooking,
} = require('../controllers/paymentController');

const router = express.Router();

router.get('/:bookingRef', getBooking);
router.post('/:bookingRef/otp/send', sendBookingOtp);
router.post('/:bookingRef/otp/verify', verifyBookingOtp);
router.post('/:bookingRef/pay', startBookingPayment);
router.post('/:bookingRef/refund', refundBooking);

module.exports = router;
