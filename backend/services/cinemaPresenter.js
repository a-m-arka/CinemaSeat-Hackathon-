const DHAKA_TIME_ZONE = 'Asia/Dhaka';

const movieToJSON = (movie) => ({
  id: movie.id,
  title: movie.name,
  name: movie.name,
  releaseDate: movie.releaseDate,
  poster: movie.poster,
  genre: movie.genre || '',
  duration: movie.duration || '',
  rating: movie.rating || '',
  description: movie.description || '',
});

const showToJSON = (show, movie) => {
  const dateTime = new Date(show.dateTime);

  return {
    id: show.id,
    movieId: show.movieId,
    theatreId: show.theatreId,
    theatre: show.theatreName,
    hall: show.theatreName,
    dateTime: dateTime.toISOString(),
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: DHAKA_TIME_ZONE,
    }).format(dateTime),
    date: new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: DHAKA_TIME_ZONE,
    }).format(dateTime),
    ...(movie ? { movie: movieToJSON(movie) } : {}),
  };
};

const tierForRow = (row) => {
  const normalizedRow = String(row).toUpperCase();
  if (['G', 'H'].includes(normalizedRow)) return 'VIP';
  if (['E', 'F'].includes(normalizedRow)) return 'Premium';
  if (['C', 'D'].includes(normalizedRow)) return 'Classic';
  return 'Standard';
};

const priceForRow = (row) => ({
  Standard: 350,
  Classic: 450,
  Premium: 500,
  VIP: 600,
})[tierForRow(row)];

const seatToJSON = (seat) => ({
  id: seat.seatId,
  seatId: seat.seatId,
  row: seat.row,
  column: seat.number,
  number: seat.number,
  label: seat.seatId,
  tier: seat.tier || tierForRow(seat.row),
  price: seat.price,
  status: seat.status,
});

const bookingSeatIds = (booking) => (
  booking.seatIds?.length
    ? booking.seatIds.map(String)
    : booking.seatId
      ? [String(booking.seatId)]
      : []
);

const bookingSeats = (booking) => (
  booking.seats?.length
    ? booking.seats.map((seat) => ({
      id: seat.id || seat.seatId || seat.label,
      seatId: seat.seatId || seat.id || seat.label,
      label: seat.label || seat.seatId || seat.id,
      row: seat.row,
      column: seat.column || seat.number,
      number: seat.number || seat.column,
      tier: seat.tier,
      price: seat.price,
    }))
    : bookingSeatIds(booking).map((seatId) => ({
      id: seatId,
      seatId,
      label: seatId,
    }))
);

const holdStatus = (booking) => {
  if (booking.status === 'CONFIRMED') return 'COMPLETED';
  if (booking.status === 'CANCELLED') return 'CANCELLED';
  if (booking.status === 'EXPIRED') return 'EXPIRED';
  if (booking.status === 'PAYMENT_FAILED') return 'FAILED';
  if (
    booking.status !== 'PAYMENT_PENDING'
    && booking.holdExpiresAt
    && new Date(booking.holdExpiresAt) <= new Date()
  ) return 'EXPIRED';
  return 'ACTIVE';
};

const holdToJSON = (booking) => {
  const seatIds = bookingSeatIds(booking);
  const seats = bookingSeats(booking);
  const seatLabels = seats.map((seat) => seat.label || seat.seatId || seat.id);
  const tiers = [...new Set(seats.map((seat) => seat.tier).filter(Boolean))];

  return {
    id: booking.bookingRef,
    bookingRef: booking.bookingRef,
    showId: booking.showId,
    movieId: booking.movieId,
    movieTitle: booking.movieTitle,
    moviePoster: booking.moviePoster,
    theatre: booking.theatre,
    showTime: booking.showTime,
    showDate: booking.showDate,
    seatIds,
    seatLabels,
    seats,
    tier: tiers.length === 1 ? tiers[0] : 'Mixed',
    price: booking.amount,
    totalPrice: booking.amount,
    expiresAt: booking.holdExpiresAt?.toISOString?.() || booking.holdExpiresAt,
    status: holdStatus(booking),
    phone: booking.phone,
    otpVerified: ['OTP_VERIFIED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(booking.status),
  };
};

const paymentToJSON = (booking) => ({
  id: booking.paymentId,
  paymentId: booking.paymentId,
  holdId: booking.bookingRef,
  bookingReference: booking.bookingRef,
  showId: booking.showId,
  movieId: booking.movieId,
  movieTitle: booking.movieTitle,
  moviePoster: booking.moviePoster,
  theatre: booking.theatre,
  showTime: booking.showTime,
  showDate: booking.showDate,
  seatIds: bookingSeatIds(booking),
  seatLabels: bookingSeats(booking).map((seat) => seat.label || seat.seatId || seat.id),
  seats: bookingSeats(booking),
  amount: booking.amount,
  phone: booking.phone,
  status: booking.paymentStatus === 'REFUNDED' ? 'SUCCEEDED' : booking.paymentStatus,
  bookingStatus: booking.status === 'CANCELLED'
    ? 'CANCELLED'
    : booking.status === 'CONFIRMED'
      ? 'CONFIRMED'
      : booking.status === 'PAYMENT_FAILED'
        ? 'FAILED'
        : 'PENDING',
  refundStatus: booking.refundStatus,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  cancelledAt: booking.cancelledAt,
});

module.exports = {
  movieToJSON,
  showToJSON,
  tierForRow,
  priceForRow,
  seatToJSON,
  bookingSeatIds,
  bookingSeats,
  holdToJSON,
  paymentToJSON,
};
