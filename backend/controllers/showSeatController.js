const crypto = require('crypto');
const ShowSeat = require('../models/ShowSeat');
const Booking = require('../models/Booking');
const { HOLD_TTL_SECONDS } = require('../config/env');

const getShowSeats = async (req, res, next) => {
  const showId = Number(req.params.showId);

  if (!Number.isInteger(showId)) {
    return res.status(400).json({ message: 'showId must be a number' });
  }

  try {
    const now = new Date();

    await ShowSeat.updateMany(
      {
        showId,
        status: 'HELD',
        holdExpiresAt: { $ne: null, $lte: now },
      },
      {
        $set: {
          status: 'AVAILABLE',
          bookingRef: null,
          holdExpiresAt: null,
        },
      }
    );

    const seats = await ShowSeat.find({ showId })
      .select('-__v')
      .sort({ row: 1, number: 1 })
      .lean();

    return res.status(200).json({ showId, seats });
  } catch (error) {
    return next(error);
  }
};

const holdShowSeat = async (req, res, next) => {
  const showId = Number(req.params.showId);
  const seatId = typeof req.body?.seatId === 'string' ? req.body.seatId.trim() : '';

  if (!Number.isInteger(showId)) {
    return res.status(400).json({ message: 'showId must be a number' });
  }

  if (!seatId) {
    return res.status(400).json({ message: 'seatId is required' });
  }

  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + HOLD_TTL_SECONDS * 1000);
  const bookingRef = crypto.randomUUID();

  try {
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
      {
        new: true,
        runValidators: true,
      }
    );

    if (!seat) {
      return res.status(409).json({
        code: 'SEAT_UNAVAILABLE',
        message: 'Seat is already held or booked',
      });
    }

    try {
      await Booking.create({
        bookingRef,
        showId,
        seatId,
        amount: seat.price,
        status: 'HELD',
        paymentStatus: 'NONE',
        holdExpiresAt,
      });
    } catch (error) {
      await ShowSeat.updateOne(
        { showId, seatId, bookingRef, status: 'HELD' },
        {
          $set: {
            status: 'AVAILABLE',
            bookingRef: null,
            holdExpiresAt: null,
          },
        }
      );

      throw error;
    }

    return res.status(201).json({
      bookingRef,
      seatId,
      status: 'HELD',
      price: seat.price,
      amount: seat.price,
      holdExpiresAt,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getShowSeats,
  holdShowSeat,
};
