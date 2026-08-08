const Booking = require('../models/Booking');
const ShowSeat = require('../models/ShowSeat');

const bookingFields = 'bookingRef showId seatId amount status paymentStatus holdExpiresAt createdAt updatedAt -_id';

const getBooking = async (req, res, next) => {
  const bookingRef = typeof req.params.bookingRef === 'string'
    ? req.params.bookingRef.trim()
    : '';

  if (!bookingRef) {
    return res.status(400).json({ message: 'bookingRef is required' });
  }

  try {
    let booking = await Booking.findOne({ bookingRef })
      .select(bookingFields)
      .lean();

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const now = new Date();
    const holdExpired = booking.status === 'HELD'
      && booking.holdExpiresAt
      && new Date(booking.holdExpiresAt) <= now;

    if (holdExpired) {
      const expiredBooking = await Booking.findOneAndUpdate(
        {
          bookingRef,
          status: 'HELD',
          holdExpiresAt: { $ne: null, $lte: now },
        },
        { $set: { status: 'EXPIRED' } },
        { new: true }
      )
        .select(bookingFields)
        .lean();

      if (expiredBooking) {
        await ShowSeat.updateOne(
          {
            showId: expiredBooking.showId,
            seatId: expiredBooking.seatId,
            bookingRef: expiredBooking.bookingRef,
            status: { $ne: 'BOOKED' },
          },
          {
            $set: {
              status: 'AVAILABLE',
              bookingRef: null,
              holdExpiresAt: null,
            },
          }
        );

        booking = expiredBooking;
      }
    }

    return res.status(200).json(booking);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getBooking,
};
