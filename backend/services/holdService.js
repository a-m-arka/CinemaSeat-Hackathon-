const crypto = require('crypto');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const ShowSeat = require('../models/ShowSeat');
const { HOLD_TTL_SECONDS } = require('../config/env');
const {
  seatToJSON,
  showToJSON,
  holdToJSON,
} = require('./cinemaPresenter');

const serviceError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const releaseBookingSeats = (bookingRef, statuses = ['HELD']) => ShowSeat.updateMany(
  { bookingRef, status: { $in: statuses } },
  {
    $set: {
      status: 'AVAILABLE',
      bookingRef: null,
      holdExpiresAt: null,
    },
  }
);

const createSeatHold = async ({ showId, seatIds }) => {
  const show = await Show.findOne({ id: showId }).lean();
  if (!show) throw serviceError(404, 'SHOW_NOT_FOUND', 'Show not found');

  const movie = await Movie.findOne({ id: show.movieId }).lean();
  const bookingRef = crypto.randomUUID();
  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + HOLD_TTL_SECONDS * 1000);
  const acquiredSeats = [];

  try {
    for (const seatId of seatIds) {
      const seat = await ShowSeat.findOneAndUpdate(
        {
          showId,
          seatId,
          $or: [
            { status: 'AVAILABLE' },
            { status: 'HELD', holdExpiresAt: { $ne: null, $lte: now } },
          ],
        },
        {
          $set: {
            status: 'HELD',
            bookingRef,
            holdExpiresAt,
          },
        },
        { new: true, runValidators: true }
      );

      if (!seat) {
        throw serviceError(
          409,
          'SEAT_UNAVAILABLE',
          'One or more seats are already held or booked'
        );
      }

      acquiredSeats.push(seat);
    }

    const showSnapshot = showToJSON(show, movie);
    const seatSnapshots = acquiredSeats.map(seatToJSON);
    const amount = seatSnapshots.reduce((total, seat) => total + Number(seat.price), 0);

    const booking = await Booking.create({
      bookingRef,
      showId,
      seatIds,
      seats: seatSnapshots,
      amount,
      movieId: movie?.id,
      movieTitle: movie?.name || show.movieName,
      moviePoster: movie?.poster,
      theatre: showSnapshot.theatre,
      showTime: showSnapshot.time,
      showDate: showSnapshot.date,
      status: 'HELD',
      paymentStatus: 'NONE',
      holdExpiresAt,
    });

    return {
      booking,
      hold: holdToJSON(booking),
    };
  } catch (error) {
    await releaseBookingSeats(bookingRef);
    throw error;
  }
};

module.exports = {
  createSeatHold,
  releaseBookingSeats,
  serviceError,
};
