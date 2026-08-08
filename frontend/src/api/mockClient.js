const STORAGE_KEY = "cinemaseat:mock-api:v1"
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
  },
  {
    id: 2,
    title: "The Final Horizon",
    genre: "Sci-Fi • Drama",
    duration: "2h 6m",
    rating: "PG-13",
    poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
  },
  {
    id: 3,
    title: "Midnight Run",
    genre: "Thriller • Mystery",
    duration: "1h 54m",
    rating: "R",
    poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728",
  },
]

const originalShowtimes = [
  { id: 101, time: "10:30 AM", theatre: "Hall 1" },
  { id: 102, time: "3:00 PM", theatre: "Hall 1" },
  { id: 103, time: "8:00 PM", theatre: "Hall 2" },
  { id: 104, time: "11:59 PM", theatre: "Hall 2" },
]

const showtimes = movies.flatMap((movie, movieIndex) =>
  originalShowtimes.map((show, showIndex) => ({
    ...show,
    id: (movieIndex + 1) * 100 + showIndex + 1,
    movieId: movie.id,
    date: "Today",
  })),
)

const originalSeats = [
  { id: 1, label: "A1", status: "AVAILABLE", price: 450 },
  { id: 2, label: "A2", status: "AVAILABLE", price: 450 },
  { id: 3, label: "A3", status: "BOOKED", price: 450 },
  { id: 4, label: "A4", status: "AVAILABLE", price: 450 },
  { id: 5, label: "A5", status: "HELD", price: 450 },
  { id: 6, label: "A6", status: "AVAILABLE", price: 450 },
  { id: 7, label: "B1", status: "AVAILABLE", price: 450 },
  { id: 8, label: "B2", status: "AVAILABLE", price: 450 },
  { id: 9, label: "B3", status: "AVAILABLE", price: 450 },
  { id: 10, label: "B4", status: "AVAILABLE", price: 450 },
  { id: 11, label: "B5", status: "BOOKED", price: 450 },
  { id: 12, label: "B6", status: "AVAILABLE", price: 450 },
  { id: 13, label: "C1", status: "AVAILABLE", price: 500 },
  { id: 14, label: "C2", status: "AVAILABLE", price: 500 },
  { id: 15, label: "C3", status: "AVAILABLE", price: 500 },
  { id: 16, label: "C4", status: "AVAILABLE", price: 500 },
  { id: 17, label: "C5", status: "AVAILABLE", price: 500 },
  { id: 18, label: "C6", status: "AVAILABLE", price: 500 },
]

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
      payment.error = "The demo payment gateway declined this transaction."
    } else {
      payment.status = "SUCCEEDED"
      payment.bookingReference = `CS-${payment.id.slice(-8).toUpperCase()}`
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
    const hold = {
      id: makeId("hold"),
      showId: show.id,
      seatIds: requestedSeats.map((seat) => seat.id),
      seatLabels,
      seatLabel: seatLabels.join(", "),
      totalPrice,
      price: totalPrice,
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
      seatLabels: hold.seatLabels || [hold.seatLabel],
      seatLabel: hold.seatLabel,
      amount: hold.totalPrice ?? hold.price,
      phone: hold.phone,
      status: "PENDING",
      outcome: String(body.phone).endsWith("0000") ? "FAILED" : "SUCCEEDED",
      createdAt: now,
      updatedAt: now,
    }
    state.payments[payment.id] = payment
    writeState(state)
    return { data: { payment: clone(payment) } }
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
