const crypto = require('crypto');
const Booking = require('../models/Booking');
const ShowSeat = require('../models/ShowSeat');
const gatewayClient = require('../services/gatewayClient');
const {
  bookingSeatIds,
  paymentToJSON,
} = require('../services/cinemaPresenter');
const {
  PAYMENT_CURRENCY,
  PAYMENT_CALLBACK_URL,
} = require('../config/env');

const bookingFields = 'bookingRef showId seatId seatIds seats amount phone status paymentId paymentStatus holdExpiresAt verificationToken movieId movieTitle moviePoster theatre showTime showDate createdAt updatedAt -_id';

const getBookingRef = (req) => (
  typeof req.params.bookingRef === 'string' ? req.params.bookingRef.trim() : ''
);

const releaseSeat = (booking, statuses) => ShowSeat.updateMany(
  {
    showId: booking.showId,
    seatId: { $in: bookingSeatIds(booking) },
    bookingRef: booking.bookingRef,
    status: { $in: statuses },
  },
  {
    $set: {
      status: 'AVAILABLE',
      bookingRef: null,
      holdExpiresAt: null,
    },
  }
);

const sendBookingOtp = async (req, res, next) => {
  const bookingRef = getBookingRef(req);
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';

  if (!bookingRef || !phone) {
    return res.status(400).json({ message: 'bookingRef and phone are required' });
  }

  try {
    const booking = await Booking.findOneAndUpdate(
      {
        bookingRef,
        status: 'HELD',
        holdExpiresAt: { $gt: new Date() },
      },
      { $set: { phone } },
      { new: true }
    );

    if (!booking) {
      const exists = await Booking.exists({ bookingRef });
      return res.status(exists ? 409 : 404).json({
        code: exists ? 'BOOKING_NOT_ACTIVE' : 'BOOKING_NOT_FOUND',
        message: exists ? 'Booking hold is no longer active' : 'Booking not found',
      });
    }

    const gatewayResponse = await gatewayClient.sendOtp(phone, bookingRef);

    if (gatewayResponse.status !== 202) {
      return res.status(502).json({
        code: 'OTP_SEND_FAILED',
        message: 'Gateway did not accept the OTP request',
      });
    }

    return res.status(202).json({
      bookingRef,
      otpStatus: 'PENDING',
    });
  } catch (error) {
    return next(error);
  }
};

const verifyBookingOtp = async (req, res, next) => {
  const bookingRef = getBookingRef(req);
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

  if (!bookingRef || !code) {
    return res.status(400).json({ message: 'bookingRef and code are required' });
  }

  try {
    const activeBooking = await Booking.exists({
      bookingRef,
      phone: { $ne: null },
      status: 'HELD',
      holdExpiresAt: { $gt: new Date() },
    });

    if (!activeBooking) {
      const exists = await Booking.exists({ bookingRef });
      return res.status(exists ? 409 : 404).json({
        code: exists ? 'BOOKING_NOT_ACTIVE' : 'BOOKING_NOT_FOUND',
        message: exists ? 'Booking hold is no longer active' : 'Booking not found',
      });
    }

    const gatewayResponse = await gatewayClient.verifyOtp(bookingRef, code);

    if (gatewayResponse.status === 400) {
      return res.status(400).json({
        code: 'OTP_INVALID',
        message: 'OTP verification failed',
      });
    }

    if (gatewayResponse.status !== 200) {
      return res.status(502).json({
        code: 'OTP_GATEWAY_ERROR',
        message: 'Gateway could not verify the OTP',
      });
    }

    const verificationToken = crypto.randomUUID();
    const booking = await Booking.findOneAndUpdate(
      {
        bookingRef,
        status: 'HELD',
        holdExpiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: 'OTP_VERIFIED',
          verificationToken,
        },
      },
      { new: true }
    )
      .select(bookingFields)
      .lean();

    if (!booking) {
      return res.status(409).json({
        code: 'BOOKING_NOT_ACTIVE',
        message: 'Booking hold expired during OTP verification',
      });
    }

    return res.status(200).json({
      verified: true,
      verificationToken,
      booking,
    });
  } catch (error) {
    return next(error);
  }
};

const startBookingPayment = async (req, res, next) => {
  const bookingRef = getBookingRef(req);

  if (!bookingRef) {
    return res.status(400).json({ message: 'bookingRef is required' });
  }

  try {
    const now = new Date();
    const booking = await Booking.findOneAndUpdate(
      {
        bookingRef,
        status: 'OTP_VERIFIED',
        paymentStatus: 'NONE',
        holdExpiresAt: { $gt: now },
      },
      {
        $set: {
          status: 'PAYMENT_PENDING',
          paymentStatus: 'PENDING',
        },
      },
      { new: true }
    );

    if (!booking) {
      const exists = await Booking.exists({ bookingRef });
      return res.status(exists ? 409 : 404).json({
        code: exists ? 'BOOKING_NOT_PAYABLE' : 'BOOKING_NOT_FOUND',
        message: exists ? 'Booking is not ready for payment' : 'Booking not found',
      });
    }

    const seatIds = bookingSeatIds(booking);
    const protectedSeats = await ShowSeat.updateMany(
      {
        showId: booking.showId,
        seatId: { $in: seatIds },
        bookingRef,
        status: 'HELD',
      },
      { $set: { holdExpiresAt: null } }
    );

    if (protectedSeats.matchedCount !== seatIds.length) {
      await Booking.updateOne(
        { bookingRef, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' },
        { $set: { status: 'OTP_VERIFIED', paymentStatus: 'NONE' } }
      );
      await ShowSeat.updateMany(
        { showId: booking.showId, seatId: { $in: seatIds }, bookingRef, status: 'HELD' },
        { $set: { holdExpiresAt: booking.holdExpiresAt } }
      );

      return res.status(409).json({
        code: 'SEAT_HOLD_LOST',
        message: 'The seat is no longer held by this booking',
      });
    }

    const gatewayResponse = await gatewayClient.charge(
      booking.amount,
      PAYMENT_CURRENCY,
      bookingRef,
      PAYMENT_CALLBACK_URL
    );

    if (gatewayResponse.status !== 202) {
      await Booking.updateOne(
        { bookingRef, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' },
        { $set: { status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' } }
      );
      await releaseSeat(booking, ['HELD']);

      return res.status(502).json({
        code: 'PAYMENT_REJECTED',
        message: 'Gateway did not accept the payment request',
      });
    }

    const paymentId = gatewayResponse.data?.payment_id;

    if (!paymentId) {
      return res.status(502).json({
        code: 'INVALID_GATEWAY_RESPONSE',
        message: 'Gateway accepted payment without returning a payment ID',
      });
    }

    let updatedBooking = await Booking.findOneAndUpdate(
      { bookingRef, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' },
      { $set: { paymentId } },
      { new: true }
    );

    if (!updatedBooking) updatedBooking = await Booking.findOne({ bookingRef });

    return res.status(202).json({
      bookingRef,
      paymentId,
      status: gatewayResponse.data.status || 'PENDING',
      payment: paymentToJSON(updatedBooking || { ...booking.toObject(), paymentId }),
    });
  } catch (error) {
    return next(error);
  }
};

const handlePaymentCallback = async (req, res, next) => {
  const {
    event_id: eventId,
    payment_id: paymentId,
    booking_ref: bookingRef,
    status,
    amount,
  } = req.body || {};

  if (!eventId || !paymentId || !bookingRef || !['SUCCEEDED', 'FAILED', 'REFUNDED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid payment callback' });
  }

  try {
    let booking = await Booking.findOne({ bookingRef });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (amount !== undefined && Number(amount) !== booking.amount) {
      return res.status(400).json({ message: 'Payment amount does not match booking amount' });
    }

    if (booking.paymentId && booking.paymentId !== paymentId) {
      return res.status(409).json({ message: 'Payment ID does not match booking' });
    }

    if (status === 'SUCCEEDED') {
      if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'SUCCEEDED') {
        return res.status(200).json({ received: true, status: 'SUCCEEDED' });
      }

      if (booking.status !== 'PAYMENT_PENDING' || booking.paymentStatus !== 'PENDING') {
        return res.status(409).json({ message: 'Booking is not awaiting payment' });
      }

      const seatIds = bookingSeatIds(booking);
      await ShowSeat.updateMany(
        {
          showId: booking.showId,
          seatId: { $in: seatIds },
          bookingRef,
          status: 'HELD',
        },
        {
          $set: {
            status: 'BOOKED',
            holdExpiresAt: null,
          },
        }
      );

      const bookedSeatCount = await ShowSeat.countDocuments({
        showId: booking.showId,
        seatId: { $in: seatIds },
        bookingRef,
        status: 'BOOKED',
      });

      if (bookedSeatCount !== seatIds.length) {
        return res.status(409).json({ message: 'One or more seats are no longer owned by this booking' });
      }

      booking = await Booking.findOneAndUpdate(
        {
          bookingRef,
          status: 'PAYMENT_PENDING',
          paymentStatus: 'PENDING',
        },
        {
          $set: {
            status: 'CONFIRMED',
            paymentStatus: 'SUCCEEDED',
            paymentId,
            gatewayEventId: eventId,
          },
        },
        { new: true }
      );

      if (!booking) {
        booking = await Booking.findOne({ bookingRef });
      }
    }

    if (status === 'FAILED') {
      const failedBooking = await Booking.findOneAndUpdate(
        {
          bookingRef,
          status: 'PAYMENT_PENDING',
          paymentStatus: 'PENDING',
        },
        {
          $set: {
            status: 'PAYMENT_FAILED',
            paymentStatus: 'FAILED',
            paymentId,
            gatewayEventId: eventId,
          },
        },
        { new: true }
      );

      if (failedBooking) {
        await releaseSeat(failedBooking, ['HELD']);
        booking = failedBooking;
      }
    }

    if (status === 'REFUNDED') {
      const refundedBooking = await Booking.findOneAndUpdate(
        {
          bookingRef,
          paymentStatus: { $in: ['PENDING', 'SUCCEEDED'] },
        },
        {
          $set: {
            paymentStatus: 'REFUNDED',
            refundStatus: 'SUCCEEDED',
            paymentId,
            gatewayEventId: eventId,
          },
        },
        { new: true }
      );

      if (refundedBooking) {
        await releaseSeat(refundedBooking, ['HELD', 'BOOKED']);
        booking = refundedBooking;
      }
    }

    return res.status(200).json({
      received: true,
      bookingRef,
      status: booking.paymentStatus,
    });
  } catch (error) {
    return next(error);
  }
};

const requestHoldOtp = (req, res, next) => {
  req.params.bookingRef = req.params.holdId;
  return sendBookingOtp(req, res, next);
};

const verifyHoldOtp = (req, res, next) => {
  req.params.bookingRef = req.params.holdId;
  return verifyBookingOtp(req, res, next);
};

const startPayment = async (req, res, next) => {
  const holdId = typeof req.body?.holdId === 'string' ? req.body.holdId.trim() : '';
  const verificationToken = typeof req.body?.verificationToken === 'string'
    ? req.body.verificationToken.trim()
    : '';

  if (!holdId || !verificationToken) {
    return res.status(400).json({ message: 'holdId and verificationToken are required' });
  }

  try {
    const verifiedBooking = await Booking.exists({
      bookingRef: holdId,
      status: 'OTP_VERIFIED',
      verificationToken,
      holdExpiresAt: { $gt: new Date() },
    });

    if (!verifiedBooking) {
      return res.status(403).json({ message: 'Verify your phone before payment' });
    }

    req.params.bookingRef = holdId;
    return startBookingPayment(req, res, next);
  } catch (error) {
    return next(error);
  }
};

const getPayment = async (req, res, next) => {
  const paymentId = typeof req.params.paymentId === 'string' ? req.params.paymentId.trim() : '';
  if (!paymentId) return res.status(400).json({ message: 'paymentId is required' });

  try {
    const booking = await Booking.findOne({ paymentId });
    if (!booking) return res.status(404).json({ message: 'Payment not found' });
    return res.status(200).json({ payment: paymentToJSON(booking) });
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  const bookingReference = typeof req.params.bookingRef === 'string'
    ? req.params.bookingRef.trim()
    : '';

  if (!bookingReference) {
    return res.status(400).json({ message: 'bookingReference is required' });
  }

  try {
    const booking = await Booking.findOneAndUpdate(
      {
        $or: [
          { bookingRef: bookingReference },
          { paymentId: bookingReference },
        ],
        status: 'CONFIRMED',
        paymentStatus: 'SUCCEEDED',
        paymentId: { $ne: null },
      },
      {
        $set: {
          status: 'CANCELLED',
          paymentStatus: 'PENDING',
          refundStatus: 'PENDING',
          cancelledAt: new Date(),
        },
      },
      { new: true }
    );

    if (!booking) {
      const existing = await Booking.findOne({
        $or: [
          { bookingRef: bookingReference },
          { paymentId: bookingReference },
        ],
      });

      return res.status(existing ? 409 : 404).json({
        code: existing ? 'BOOKING_NOT_CONFIRMED' : 'BOOKING_NOT_FOUND',
        message: existing
          ? 'Only a confirmed booking can be cancelled'
          : 'Booking not found',
      });
    }

    const gatewayResponse = await gatewayClient.refund(booking.paymentId);

    if (gatewayResponse.status !== 202) {
      await Booking.updateOne(
        { _id: booking._id, status: 'CANCELLED', paymentStatus: 'PENDING' },
        {
          $set: {
            status: 'CONFIRMED',
            paymentStatus: 'SUCCEEDED',
            refundStatus: 'FAILED',
            cancelledAt: null,
          },
        }
      );

      return res.status(502).json({ message: 'Gateway did not accept the refund request' });
    }

    await releaseSeat(booking, ['BOOKED']);
    return res.status(202).json({ booking: paymentToJSON(booking) });
  } catch (error) {
    return next(error);
  }
};

const refundBooking = async (req, res, next) => {
  const bookingRef = getBookingRef(req);

  if (!bookingRef) {
    return res.status(400).json({ message: 'bookingRef is required' });
  }

  try {
    const booking = await Booking.findOneAndUpdate(
      {
        bookingRef,
        paymentStatus: 'SUCCEEDED',
        paymentId: { $ne: null },
      },
      { $set: { paymentStatus: 'PENDING' } },
      { new: true }
    );

    if (!booking) {
      const exists = await Booking.exists({ bookingRef });
      return res.status(exists ? 409 : 404).json({
        code: exists ? 'BOOKING_NOT_REFUNDABLE' : 'BOOKING_NOT_FOUND',
        message: exists ? 'Booking is not eligible for refund' : 'Booking not found',
      });
    }

    const gatewayResponse = await gatewayClient.refund(booking.paymentId);

    if (gatewayResponse.status !== 202) {
      await Booking.updateOne(
        { bookingRef, paymentStatus: 'PENDING' },
        { $set: { paymentStatus: 'SUCCEEDED' } }
      );

      return res.status(502).json({
        code: 'REFUND_REJECTED',
        message: 'Gateway did not accept the refund request',
      });
    }

    return res.status(202).json({
      bookingRef,
      paymentId: booking.paymentId,
      status: gatewayResponse.data?.status || 'PENDING',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  sendBookingOtp,
  verifyBookingOtp,
  startBookingPayment,
  handlePaymentCallback,
  refundBooking,
  requestHoldOtp,
  verifyHoldOtp,
  startPayment,
  getPayment,
  cancelBooking,
};
