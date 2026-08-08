const Booking = require('../models/Booking');
const { holdToJSON } = require('../services/cinemaPresenter');
const { releaseBookingSeats } = require('../services/holdService');

const expireHoldIfNeeded = async (booking) => {
  const expirableStatuses = ['HELD', 'OTP_VERIFIED'];
  const expired = expirableStatuses.includes(booking.status)
    && booking.holdExpiresAt
    && new Date(booking.holdExpiresAt) <= new Date();

  if (!expired) return booking;

  const expiredBooking = await Booking.findOneAndUpdate(
    {
      bookingRef: booking.bookingRef,
      status: { $in: expirableStatuses },
      holdExpiresAt: { $lte: new Date() },
    },
    { $set: { status: 'EXPIRED' } },
    { new: true }
  );

  if (expiredBooking) {
    await releaseBookingSeats(booking.bookingRef);
    return expiredBooking;
  }

  return Booking.findOne({ bookingRef: booking.bookingRef });
};

const getHold = async (req, res, next) => {
  const holdId = typeof req.params.holdId === 'string' ? req.params.holdId.trim() : '';
  if (!holdId) return res.status(400).json({ message: 'holdId is required' });

  try {
    let booking = await Booking.findOne({ bookingRef: holdId });
    if (!booking) return res.status(404).json({ message: 'Hold not found' });

    booking = await expireHoldIfNeeded(booking);
    return res.status(200).json({ hold: holdToJSON(booking) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getHold,
  expireHoldIfNeeded,
};
