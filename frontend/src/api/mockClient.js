const STORAGE_KEY = "cinemaseat:mock-api:v2"
const HOLD_DURATION_MS = 90_000
const PAYMENT_DELAY_MS = 4_000
const DEMO_OTP = "123456"

const movies = [
  {
    id: 1,
    title: "Spider-Man: Brand New Day",
    genre: "Action • Adventure",
    duration: "2h 18m",
    rating: "PG-13",
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
    description: "A new threat pulls a young hero back into a city that has almost forgotten what hope looks like.",
  },
  {
    id: 2,
    title: "The Final Horizon",
    genre: "Sci-Fi • Drama",
    duration: "2h 6m",
    rating: "PG-13",
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
    description: "A stranded crew follows an impossible signal beyond the edge of mapped space.",
  },
  {
    id: 3,
    title: "Midnight Run",
    genre: "Thriller • Mystery",
    duration: "1h 54m",
    rating: "R",
    poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728",
    description: "One sleepless night, one missing witness, and a city full of people with something to hide.",
  },
  {
    id: 4,
    title: "Echoes of Tomorrow",
    genre: "Sci-Fi • Mystery",
    duration: "2h 11m",
    rating: "PG-13",
    poster: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    description: "A physicist begins receiving messages from a future that insists it can still be changed.",
  },
  {
    id: 5,
    title: "The Last Monsoon",
    genre: "Drama • Romance",
    duration: "1h 58m",
    rating: "PG",
    poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c",
    description: "Two childhood friends reunite during a storm that brings old promises back to the surface.",
  },
  {
    id: 6,
    title: "Neon Pursuit",
    genre: "Action • Thriller",
    duration: "1h 49m",
    rating: "R",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
    description: "A courier with one final delivery races through the city while every syndicate closes in.",
  },
  {
    id: 7,
    title: "Kingdom of Ash",
    genre: "Fantasy • Adventure",
    duration: "2h 27m",
    rating: "PG-13",
    poster: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
    description: "The last heir to a ruined kingdom must cross forbidden lands to wake an ancient guardian.",
  },
  {
    id: 8,
    title: "Laugh Track",
    genre: "Comedy • Drama",
    duration: "1h 42m",
    rating: "PG-13",
    poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
    description: "A struggling comedian accidentally becomes famous for the one joke he never meant to tell.",
  },
  {
    id: 9,
    title: "Silent Depths",
    genre: "Horror • Mystery",
    duration: "1h 51m",
    rating: "R",
    poster: "https://images.unsplash.com/photo-1543536448-d209d2d13a1c",
    description: "A deep-sea research team discovers that the sound beneath their station is getting closer.",
  },
]

const originalShowtimes = [
  { id: 101, time: "10:30 AM", theatre: "Hall 1" },
  { id: 102, time: "3:00 PM", theatre: "Hall 1" },
  { id: 103, time: "8:00 PM", theatre: "Hall 2" },
  { id: 104, time: "11:59 PM", theatre: "Hall 2" },
]

const showDateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date())

const showtimes = movies.flatMap((movie, movieIndex) =>
  originalShowtimes.map((show, showIndex) => ({
    ...show,
    id: (movieIndex + 1) * 100 + showIndex + 1,
    movieId: movie.id,
    date: showDateLabel,
  })),
)

const bookedSeatIds = new Set([3, 12, 18, 27, 28, 44, 45, 61, 68, 77])
const externallyHeldSeatIds = new Set([6, 19, 34, 37, 53, 72])

const originalSeats = [
  { row: "A", tier: "Standard", price: 350 },
  { row: "B", tier: "Standard", price: 350 },
  { row: "C", tier: "Classic", price: 450 },
  { row: "D", tier: "Classic", price: 450 },
  { row: "E", tier: "Premium", price: 500 },
  { row: "F", tier: "Premium", price: 500 },
  { row: "G", tier: "VIP", price: 600 },
  { row: "H", tier: "VIP", price: 600 },
].flatMap(({ row, tier, price }, rowIndex) =>
  Array.from({ length: 10 }, (_, columnIndex) => {
    const id = rowIndex * 10 + columnIndex + 1
    return {
      id,
      row,
      column: columnIndex + 1,
      label: `${row}${columnIndex + 1}`,
      tier,
      price,
      status: bookedSeatIds.has(id)
        ? "BOOKED"
        : externallyHeldSeatIds.has(id)
          ? "HELD"
          : "AVAILABLE",
    }
  }),
)

function initialState() {
  return { holds: {}, payments: {} }
}

function readState() {
  try {
    return { ...initialState(), ...JSON.parse(window.localStorage.getItem(STORAGE_KEY)) }
  } catch {
    return initialState()
  }
}

function writeState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function apiError(status, message, code) {
  const error = new Error(message)
  error.response = { status, data: { message, ...(code ? { code } : {}) } }
  return error
}

function seatStatus(state, showId, seat) {
  const relatedHold = Object.values(state.holds).find(
    (hold) => String(hold.showId) === String(showId)
      && (hold.seatIds?.includes(seat.id) || hold.seatId === seat.id)
      && ["ACTIVE", "COMPLETED"].includes(hold.status),
  )
  if (relatedHold?.status === "COMPLETED") return "BOOKED"
  if (relatedHold?.status === "ACTIVE") return "HELD"
  return seat.status
}

function updateState() {
  const state = readState()
  const now = Date.now()

  Object.values(state.holds).forEach((hold) => {
    if (hold.status === "ACTIVE" && Date.parse(hold.expiresAt) <= now) hold.status = "EXPIRED"
  })

  Object.values(state.payments).forEach((payment) => {
    if (payment.status !== "PENDING" || now - Date.parse(payment.createdAt) < PAYMENT_DELAY_MS) return
    const hold = state.holds[payment.holdId]
    payment.updatedAt = new Date().toISOString()
    if (!hold || hold.status !== "ACTIVE") {
      payment.status = "FAILED"
      payment.error = "The seat hold expired before payment completed."
    } else if (payment.outcome === "FAILED") {
      payment.status = "FAILED"
      payment.bookingStatus = "FAILED"
      payment.error = "The demo payment gateway declined this transaction."
    } else {
      payment.status = "SUCCEEDED"
      payment.bookingStatus = "CONFIRMED"
      payment.bookingReference = `CS-${payment.id.slice(-8).toUpperCase()}`
      payment.completedAt = payment.updatedAt
      hold.status = "COMPLETED"
    }
  })

  writeState(state)
  return state
}

function parseBody(data) {
  if (typeof data !== "string") return data || {}
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function request(method, path, body) {
  await new Promise((resolve) => window.setTimeout(resolve, 180))
  const state = updateState()
  const normalizedPath = path.replace(/\/$/, "")

  if (method === "GET" && normalizedPath === "/movies") return { data: { movies: clone(movies) } }

  const movieMatch = normalizedPath.match(/^\/movies\/(\d+)$/)
  if (method === "GET" && movieMatch) {
    const movie = movies.find((item) => item.id === Number(movieMatch[1]))
    if (!movie) throw apiError(404, "Movie not found")
    return { data: { movie: clone(movie), showtimes: clone(showtimes.filter((show) => show.movieId === movie.id)) } }
  }

  const seatsMatch = normalizedPath.match(/^\/shows\/(\d+)\/seats$/)
  if (method === "GET" && seatsMatch) {
    const show = showtimes.find((item) => item.id === Number(seatsMatch[1]))
    if (!show) throw apiError(404, "Show not found")
    return {
      data: {
        show: { ...clone(show), movie: clone(movies.find((movie) => movie.id === show.movieId)) },
        seats: originalSeats.map((seat) => ({ ...seat, status: seatStatus(state, show.id, seat) })),
      },
    }
  }

  const createHoldMatch = normalizedPath.match(/^\/shows\/(\d+)\/holds$/)
  if (method === "POST" && createHoldMatch) {
    const show = showtimes.find((item) => item.id === Number(createHoldMatch[1]))
    const requestedIds = [...new Set((body.seatIds || [body.seatId]).map(Number))]
    const requestedSeats = requestedIds.map((seatId) => originalSeats.find((seat) => seat.id === seatId)).filter(Boolean)
    if (!show || requestedSeats.length !== requestedIds.length) throw apiError(404, "Show or seat not found")
    if (requestedSeats.length < 1 || requestedSeats.length > 4) throw apiError(400, "Select between one and four seats.")
    if (requestedSeats.some((seat) => seatStatus(state, show.id, seat) !== "AVAILABLE")) {
      throw apiError(409, "That seat was just held or booked by someone else.", "SEAT_UNAVAILABLE")
    }
    const seatLabels = requestedSeats.map((seat) => seat.label)
    const totalPrice = requestedSeats.reduce((total, seat) => total + seat.price, 0)
    const movie = movies.find((item) => item.id === show.movieId)
    const hold = {
      id: makeId("hold"),
      showId: show.id,
      seatIds: requestedSeats.map((seat) => seat.id),
      seatLabels,
      seatLabel: seatLabels.join(", "),
      seats: requestedSeats.map(({ id, label, tier, price }) => ({ id, label, tier, price })),
      totalPrice,
      price: totalPrice,
      movieId: movie.id,
      movieTitle: movie.title,
      moviePoster: movie.poster,
      theatre: show.theatre,
      showTime: show.time,
      showDate: show.date,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + HOLD_DURATION_MS).toISOString(),
      phone: null,
      otpVerified: false,
    }
    state.holds[hold.id] = hold
    writeState(state)
    return { data: { hold: clone(hold) } }
  }

  const holdMatch = normalizedPath.match(/^\/holds\/([^/]+)$/)
  if (method === "GET" && holdMatch) {
    const hold = state.holds[holdMatch[1]]
    if (!hold) throw apiError(404, "Hold not found")
    return { data: { hold: clone(hold) } }
  }

  const otpMatch = normalizedPath.match(/^\/holds\/([^/]+)\/otp\/(request|resend)$/)
  if (method === "POST" && otpMatch) {
    const hold = state.holds[otpMatch[1]]
    if (!hold) throw apiError(404, "Hold not found")
    if (hold.status !== "ACTIVE") throw apiError(410, "This seat hold has expired.", "HOLD_EXPIRED")
    const phone = String(body.phone || "").replace(/[\s()-]/g, "")
    if (!/^\+?\d{10,15}$/.test(phone)) throw apiError(400, "Enter a valid phone number with 10 to 15 digits.")
    hold.phone = phone
    hold.otpCode = DEMO_OTP
    hold.otpVerified = false
    writeState(state)
    return { data: { message: "OTP sent", developmentOtp: DEMO_OTP } }
  }

  const verifyMatch = normalizedPath.match(/^\/holds\/([^/]+)\/otp\/verify$/)
  if (method === "POST" && verifyMatch) {
    const hold = state.holds[verifyMatch[1]]
    if (!hold) throw apiError(404, "Hold not found")
    if (hold.status !== "ACTIVE") throw apiError(410, "This seat hold has expired.", "HOLD_EXPIRED")
    const phone = String(body.phone || "").replace(/[\s()-]/g, "")
    if (phone !== hold.phone || String(body.code) !== hold.otpCode) throw apiError(400, "The OTP is incorrect.", "INVALID_OTP")
    hold.otpVerified = true
    hold.verificationToken = makeId("verify")
    writeState(state)
    return { data: { verified: true, verificationToken: hold.verificationToken } }
  }

  if (method === "POST" && normalizedPath === "/payments") {
    const hold = state.holds[body.holdId]
    if (!hold) throw apiError(404, "Hold not found")
    if (hold.status !== "ACTIVE") throw apiError(410, "This seat hold has expired.", "HOLD_EXPIRED")
    if (!hold.otpVerified || body.verificationToken !== hold.verificationToken) throw apiError(403, "Verify your phone before payment.")
    if (String(body.phone).endsWith("9999")) throw apiError(503, "The payment gateway is temporarily unavailable. Your seat remains held.", "GATEWAY_UNAVAILABLE")
    const existing = Object.values(state.payments).find((payment) => payment.holdId === hold.id && payment.status === "PENDING")
    if (existing) return { data: { payment: clone(existing) } }
    const now = new Date().toISOString()
    const payment = {
      id: makeId("payment"),
      holdId: hold.id,
      showId: hold.showId,
      movieId: hold.movieId,
      movieTitle: hold.movieTitle,
      moviePoster: hold.moviePoster,
      theatre: hold.theatre,
      showTime: hold.showTime,
      showDate: hold.showDate,
      seatLabels: hold.seatLabels || [hold.seatLabel],
      seatLabel: hold.seatLabel,
      seats: hold.seats || [],
      amount: hold.totalPrice ?? hold.price,
      phone: hold.phone,
      status: "PENDING",
      bookingStatus: "PENDING",
      outcome: String(body.phone).endsWith("0000") ? "FAILED" : "SUCCEEDED",
      createdAt: now,
      updatedAt: now,
    }
    state.payments[payment.id] = payment
    writeState(state)
    return { data: { payment: clone(payment) } }
  }

  const cancelBookingMatch = normalizedPath.match(/^\/bookings\/([^/]+)\/cancel$/)
  if (method === "POST" && cancelBookingMatch) {
    const bookingKey = decodeURIComponent(cancelBookingMatch[1])
    const payment = Object.values(state.payments).find(
      (item) => item.id === bookingKey || item.bookingReference === bookingKey,
    )

    if (!payment) throw apiError(404, "Booking not found")
    if (payment.bookingStatus === "CANCELLED") return { data: { booking: clone(payment) } }
    if (payment.status !== "SUCCEEDED" || (payment.bookingStatus && payment.bookingStatus !== "CONFIRMED")) {
      throw apiError(409, "Only a confirmed booking can be cancelled.", "BOOKING_NOT_CONFIRMED")
    }

    const hold = state.holds[payment.holdId]
    payment.bookingStatus = "CANCELLED"
    payment.cancelledAt = new Date().toISOString()
    payment.refundStatus = "PROCESSING"
    payment.refundAmount = payment.amount
    payment.updatedAt = payment.cancelledAt
    if (hold) hold.status = "CANCELLED"

    writeState(state)
    return { data: { booking: clone(payment) } }
  }

  const bookingMatch = normalizedPath.match(/^\/bookings\/([^/]+)$/)
  if (method === "GET" && bookingMatch) {
    const bookingKey = decodeURIComponent(bookingMatch[1])
    const payment = Object.values(state.payments).find(
      (item) => item.id === bookingKey || item.bookingReference === bookingKey,
    )
    if (!payment) throw apiError(404, "Booking not found")
    return { data: { booking: clone(payment) } }
  }

  const paymentMatch = normalizedPath.match(/^\/payments\/([^/]+)$/)
  if (method === "GET" && paymentMatch) {
    const payment = state.payments[paymentMatch[1]]
    if (!payment) throw apiError(404, "Payment not found")
    return { data: { payment: clone(payment) } }
  }

  throw apiError(404, "Mock API route not found")
}

const mockApiClient = {
  get(path) {
    return request("GET", path)
  },
  post(path, data) {
    return request("POST", path, parseBody(data))
  },
}

export default mockApiClient
