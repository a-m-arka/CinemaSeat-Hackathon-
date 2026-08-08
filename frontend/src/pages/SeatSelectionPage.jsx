import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import apiClient, { apiErrorMessage } from "../api/client"
import BookingPanel from "../components/booking/BookingPanel"
import InlineNotice from "../components/InlineNotice"
import Seat from "../components/Seat"
import useCountdown from "../hooks/useCountdown"

const holdStorageKey = (showId) => `cinemaseat:hold:${showId}`
const paymentStorageKey = (showId) => `cinemaseat:payment:${showId}`

function SeatSelectionPage() {
  const { showId } = useParams()
  const [show, setShow] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [hold, setHold] = useState(null)
  const [payment, setPayment] = useState(null)
  const [holdingSeatId, setHoldingSeatId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [paymentPollError, setPaymentPollError] = useState("")
  const expirationHandled = useRef("")
  const holdRequestInFlight = useRef(false)
  const countdown = useCountdown(hold?.expiresAt)

  const loadSeatMap = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await apiClient.get(`/shows/${showId}/seats`)
      setShow(data.show)
      setSeats(data.seats || [])
      setSelectedSeats((current) => current.filter((selected) =>
        data.seats?.some((seat) => seat.id === selected.id && seat.status === "AVAILABLE"),
      ))
      setError("")
    } catch (loadError) {
      setError(apiErrorMessage(loadError, "The seat map could not be loaded."))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [showId])

  useEffect(() => {
    let active = true

    async function recoverCheckout() {
      const storedHoldId = window.localStorage.getItem(holdStorageKey(showId))
      const storedPaymentId = window.localStorage.getItem(paymentStorageKey(showId))

      try {
        const [holdResponse, paymentResponse] = await Promise.all([
          storedHoldId ? apiClient.get(`/holds/${storedHoldId}`).catch((error) => ({ error })) : null,
          storedPaymentId ? apiClient.get(`/payments/${storedPaymentId}`).catch((error) => ({ error })) : null,
        ])
        if (!active) return

        if (holdResponse?.data.hold?.status === "ACTIVE") setHold(holdResponse.data.hold)
        else if (storedHoldId && [404, 410].includes(holdResponse?.error?.response?.status)) {
          window.localStorage.removeItem(holdStorageKey(showId))
        }

        if (paymentResponse?.data.payment) setPayment(paymentResponse.data.payment)
        else if (storedPaymentId && [404, 410].includes(paymentResponse?.error?.response?.status)) {
          window.localStorage.removeItem(paymentStorageKey(showId))
        } else if (storedPaymentId && paymentResponse?.error) {
          setPayment({ id: storedPaymentId, status: "PENDING" })
          setPaymentPollError("The saved payment could not be recovered yet.")
        }
      } finally {
        if (active) loadSeatMap()
      }
    }

    recoverCheckout()
    return () => { active = false }
  }, [loadSeatMap, showId])

  useEffect(() => {
    if (payment?.status !== "PENDING") return undefined
    let active = true

    async function pollPayment() {
      try {
        const { data } = await apiClient.get(`/payments/${payment.id}`)
        if (!active) return
        setPayment(data.payment)
        setPaymentPollError("")
        if (data.payment.status !== "PENDING") loadSeatMap({ silent: true })
      } catch {
        if (active) setPaymentPollError("The payment status service cannot be reached.")
      }
    }

    const poller = window.setInterval(pollPayment, 2_000)
    pollPayment()
    return () => { active = false; window.clearInterval(poller) }
  }, [loadSeatMap, payment?.id, payment?.status])

  useEffect(() => {
    if (!hold || hold.status !== "ACTIVE" || countdown.remainingMs > 0 || expirationHandled.current === hold.id) return
    expirationHandled.current = hold.id

    async function confirmExpiration() {
      try {
        const { data } = await apiClient.get(`/holds/${hold.id}`)
        setHold(data.hold)
        if (data.hold.status === "ACTIVE") {
          expirationHandled.current = ""
          return
        }
      } catch {
        setHold((current) => current ? { ...current, status: "EXPIRED" } : current)
      }
      window.localStorage.removeItem(holdStorageKey(showId))
      setNotice("Your hold expired. The seat map has been refreshed.")
      loadSeatMap({ silent: true })
    }

    confirmExpiration()
  }, [countdown.remainingMs, hold, loadSeatMap, showId])

  function toggleSeat(seat) {
    if (hold?.status === "ACTIVE" || payment?.status === "PENDING" || holdingSeatId) return
    const alreadySelected = selectedSeats.some((item) => item.id === seat.id)
    if (!alreadySelected && selectedSeats.length >= 4) {
      setNotice("You can select a maximum of four seats per booking.")
      return
    }
    setNotice("")
    setSelectedSeats((current) => alreadySelected
      ? current.filter((item) => item.id !== seat.id)
      : [...current, seat])
  }

  async function holdSelectedSeats() {
    if (holdRequestInFlight.current || selectedSeats.length === 0 || hold?.status === "ACTIVE" || payment?.status === "PENDING") return
    holdRequestInFlight.current = true
    setHoldingSeatId("selected")
    setError("")
    setNotice("")
    try {
      const { data } = await apiClient.post(`/shows/${showId}/holds`, {
        seatIds: selectedSeats.map((seat) => seat.id),
      })
      setHold(data.hold)
      expirationHandled.current = ""
      window.localStorage.setItem(holdStorageKey(showId), data.hold.id)
      const heldSeatIds = data.hold.seatIds || [data.hold.seatId]
      setSeats((current) => current.map((item) => heldSeatIds.includes(item.id) ? { ...item, status: "HELD" } : item))
      setSelectedSeats([])
    } catch (holdError) {
      if (holdError.response?.status === 409) {
        setNotice("Someone else just took that seat. Pick another available seat.")
        await loadSeatMap({ silent: true })
      } else {
        setError(apiErrorMessage(holdError, "The seat could not be held."))
      }
    } finally {
      holdRequestInFlight.current = false
      setHoldingSeatId("")
    }
  }

  function paymentStarted(nextPayment) {
    setPayment(nextPayment)
    setPaymentPollError("")
    window.localStorage.setItem(paymentStorageKey(showId), nextPayment.id)
  }

  const checkoutVisible = hold || payment
  const seatInteractionLocked = Boolean(holdingSeatId) || hold?.status === "ACTIVE" || payment?.status === "PENDING"
  const selectedTotal = selectedSeats.reduce((total, seat) => total + Number(seat.price || 0), 0)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <Link to={show?.movie?.id ? `/movie/${show.movie.id}` : "/"} className="text-sm text-zinc-500 hover:text-zinc-300">← Back to showtimes</Link>
        <p className="mt-6 text-sm uppercase tracking-widest text-zinc-500">{show?.movie?.title || `Show #${showId}`}</p>
        <h1 className="mt-2 text-4xl font-bold">Choose your seat</h1>
        <p className="mt-3 text-zinc-400">{show ? `${show.time} · ${show.theatre} · Select up to 4 seats` : "Select up to four available seats."}</p>
      </div>

      {error && <div className="mt-6"><InlineNotice>{error}</InlineNotice></div>}
      {notice && <div className="mt-6"><InlineNotice tone="warning">{notice}</InlineNotice></div>}

      <section className="mt-12" aria-busy={loading}>
        <div className="mx-auto max-w-2xl">
          <div className="h-2 rounded-full bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-800 shadow-[0_10px_30px_rgba(255,255,255,0.12)]" />
          <p className="mt-3 text-center text-xs uppercase tracking-[0.35em] text-zinc-500">Screen</p>
        </div>

        {loading ? (
          <div className="mx-auto mt-12 h-56 max-w-xl animate-pulse rounded-2xl bg-zinc-900" />
        ) : (
          <div className="mx-auto mt-12 grid max-w-xl grid-cols-6 place-items-center gap-2 sm:gap-3">
            {seats.map((seat) => (
              <Seat
                key={seat.id}
                seat={seat}
                isOwned={Boolean(hold?.status === "ACTIVE" && (hold.seatIds?.includes(seat.id) || hold.seatId === seat.id))}
                isSelected={selectedSeats.some((item) => item.id === seat.id)}
                disabled={seatInteractionLocked || (selectedSeats.length >= 4 && !selectedSeats.some((item) => item.id === seat.id))}
                onSelect={toggleSeat}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
        {[
          ["bg-zinc-800", "Available"],
          ["bg-white", "Selected / yours"],
          ["bg-yellow-500/30", "Held"],
          ["bg-red-500/30", "Booked"],
        ].map(([color, label]) => <div key={label} className="flex items-center gap-2"><div className={`h-4 w-4 rounded ${color}`} /><span className="text-zinc-400">{label}</span></div>)}
      </div>

      {!checkoutVisible && !loading && selectedSeats.length === 0 && (
        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
          Select between one and four available seats.
        </div>
      )}

      {!checkoutVisible && selectedSeats.length > 0 && (
        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">{selectedSeats.length} of 4 seats selected</p>
              <p className="mt-1 text-xl font-semibold">{selectedSeats.map((seat) => seat.label).join(", ")}</p>
            </div>
            <p className="text-2xl font-semibold">৳{selectedTotal}</p>
          </div>
          <button
            type="button"
            onClick={holdSelectedSeats}
            disabled={Boolean(holdingSeatId)}
            className="mt-5 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {holdingSeatId ? "Holding seats…" : `Hold ${selectedSeats.length} ${selectedSeats.length === 1 ? "seat" : "seats"}`}
          </button>
        </div>
      )}

      {checkoutVisible && (
        <div className="mx-auto mt-10 max-w-xl">
          <BookingPanel
            hold={hold || { status: "COMPLETED", seatLabel: payment.seatLabel, seatLabels: payment.seatLabels, price: payment.amount }}
            countdown={countdown}
            payment={payment}
            paymentPollError={paymentPollError}
            onPaymentStarted={paymentStarted}
          />
        </div>
      )}
    </main>
  )
}

export default SeatSelectionPage
