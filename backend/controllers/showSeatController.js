const ShowSeat = require('../models/ShowSeat');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { seatToJSON, showToJSON } = require('../services/cinemaPresenter');
const { createSeatHold } = require('../services/holdService');

const getShowSeats = async (req, res, next) => {
  const showId = Number(req.params.showId);

  if (!Number.isInteger(showId)) {
    return res.status(400).json({ message: 'showId must be a number' });
  }

  try {
    const show = await Show.findOne({ id: showId }).lean();
    if (!show) return res.status(404).json({ message: 'Show not found' });

    const movie = await Movie.findOne({ id: show.movieId }).lean();
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

    return res.status(200).json({
      show: showToJSON(show, movie),
      seats: seats.map(seatToJSON),
    });
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

  try {
    const { booking, hold } = await createSeatHold({ showId, seatIds: [seatId] });

    return res.status(201).json({
      bookingRef: booking.bookingRef,
      seatId,
      status: 'HELD',
      price: booking.amount,
      amount: booking.amount,
      holdExpiresAt: booking.holdExpiresAt,
      hold,
    });
  } catch (error) {
    return next(error);
  }
};

const holdShowSeats = async (req, res, next) => {
  const showId = Number(req.params.showId);
  const seatIds = Array.isArray(req.body?.seatIds)
    ? req.body.seatIds.map((seatId) => String(seatId).trim()).filter(Boolean)
    : [];

  if (!Number.isInteger(showId)) {
    return res.status(400).json({ message: 'showId must be a number' });
  }

  if (seatIds.length < 1 || seatIds.length > 4) {
    return res.status(400).json({ message: 'Select between one and four seats' });
  }

  if (new Set(seatIds).size !== seatIds.length) {
    return res.status(400).json({ message: 'Duplicate seatIds are not allowed' });
  }

  try {
    const { hold } = await createSeatHold({ showId, seatIds });
    return res.status(201).json({ hold });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getShowSeats,
  holdShowSeat,
  holdShowSeats,
};
