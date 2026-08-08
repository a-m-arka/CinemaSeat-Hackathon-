const Booking = require('../models/Booking');
const { paymentToJSON } = require('../services/cinemaPresenter');
const { releaseBookingSeats } = require('../services/holdService');

const getBooking = async (req, res, next) => {
  const bookingRef = typeof req.params.bookingRef === 'string'
    ? req.params.bookingRef.trim()
    : '';

  if (!bookingRef) {
    return res.status(400).json({ message: 'bookingRef is required' });
  }

  try {
    let booking = await Booking.findOne({
      $or: [
        { bookingRef },
        { paymentId: bookingRef },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const now = new Date();
    const holdExpired = ['HELD', 'OTP_VERIFIED'].includes(booking.status)
      && booking.holdExpiresAt
      && new Date(booking.holdExpiresAt) <= now;

    if (holdExpired) {
      const expiredBooking = await Booking.findOneAndUpdate(
        {
          bookingRef: booking.bookingRef,
          status: { $in: ['HELD', 'OTP_VERIFIED'] },
          holdExpiresAt: { $ne: null, $lte: now },
        },
        { $set: { status: 'EXPIRED' } },
        { new: true }
      );

      if (expiredBooking) {
        await releaseBookingSeats(expiredBooking.bookingRef);
        booking = expiredBooking;
      }
    }

    return res.status(200).json({ booking: paymentToJSON(booking) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getBooking,
};
