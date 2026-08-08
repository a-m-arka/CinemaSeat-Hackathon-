import { useRef, useState } from "react"
import apiClient, { apiErrorMessage } from "../../api/client"
import InlineNotice from "../InlineNotice"

function BookingPanel({ hold, countdown, payment, paymentPollError, onPaymentStarted }) {
  const [phone, setPhone] = useState(hold.phone || "")
  const [otp, setOtp] = useState("")
  const [otpRequested, setOtpRequested] = useState(Boolean(hold.phone))
  const [verificationToken, setVerificationToken] = useState("")
  const [demoOtp, setDemoOtp] = useState("")
  const [busyAction, setBusyAction] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const actionInFlight = useRef(false)
  const heldSeatLabels = hold.seatLabels?.length ? hold.seatLabels.join(", ") : hold.seatLabel
  const holdPrice = hold.totalPrice ?? hold.price

  const expired = hold.status !== "ACTIVE" || countdown.remainingMs <= 0
  const locked = Boolean(busyAction) || expired || payment?.status === "PENDING"

  async function requestOtp(mode) {
    if (actionInFlight.current || expired) return
    actionInFlight.current = true
    setBusyAction(mode)
    setError("")
    setMessage("")
    try {
      const { data } = await apiClient.post(`/holds/${hold.id}/otp/${mode}`, { phone })
      setOtpRequested(true)
      setVerificationToken("")
      setDemoOtp(data.developmentOtp || "")
      setMessage(mode === "resend" ? "A new OTP was sent." : "OTP sent to your phone.")
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not send the OTP."))
    } finally {
      actionInFlight.current = false
      setBusyAction("")
    }
  }

  async function verifyOtp() {
    if (actionInFlight.current || expired) return
    actionInFlight.current = true
    setBusyAction("verify")
    setError("")
    setMessage("")
    try {
      const { data } = await apiClient.post(`/holds/${hold.id}/otp/verify`, { phone, code: otp })
      setVerificationToken(data.verificationToken)
      setMessage("Phone verified. You can now start payment.")
    } catch (verifyError) {
      setError(apiErrorMessage(verifyError, "OTP verification failed."))
    } finally {
      actionInFlight.current = false
      setBusyAction("")
    }
  }

  async function startPayment() {
    if (actionInFlight.current || expired || !verificationToken) return
    actionInFlight.current = true
    setBusyAction("payment")
    setError("")
    try {
      const { data } = await apiClient.post("/payments", {
        holdId: hold.id,
        phone,
        verificationToken,
      })
      onPaymentStarted(data.payment)
    } catch (paymentError) {
      setError(apiErrorMessage(paymentError, "Payment could not be started."))
    } finally {
      actionInFlight.current = false
      setBusyAction("")
    }
  }

  if (payment?.status === "SUCCEEDED") {
    return (
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6" aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Booking confirmed</p>
        <h2 className="mt-2 text-3xl font-bold">{payment.seatLabels?.length > 1 ? "Seats" : "Seat"} {(payment.seatLabels || [payment.seatLabel]).join(", ")} {payment.seatLabels?.length > 1 ? "are" : "is"} yours</h2>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-zinc-400">Booking reference</dt><dd className="mt-1 font-mono text-lg">{payment.bookingReference}</dd></div>
          <div><dt className="text-zinc-400">Amount paid</dt><dd className="mt-1 text-lg">৳{payment.amount}</dd></div>
        </dl>
      </section>
    )
  }

  if (payment?.status === "FAILED") {
    return (
      <section className="rounded-2xl border border-red-500/30 bg-zinc-900 p-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">Payment failed</p>
        <h2 className="mt-2 text-2xl font-bold">We could not complete your booking</h2>
        <p className="mt-3 text-zinc-300">{payment.error || "The gateway declined the payment. No booking was made."}</p>
        <p className="mt-3 text-sm text-zinc-500">Choose an available seat again to retry.</p>
      </section>
    )
  }

  if (payment?.status === "PENDING") {
    return (
      <section className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-sky-400" />
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Payment pending</p>
        </div>
        <h2 className="mt-3 text-2xl font-bold">Waiting for the gateway</h2>
        <p className="mt-2 text-zinc-300">Keep this page open. If you refresh, CinemaSeat will recover this payment automatically.</p>
        {paymentPollError && <div className="mt-4"><InlineNotice tone="warning">{paymentPollError} Retrying automatically…</InlineNotice></div>}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-sm text-zinc-400">Your held seat</p>
          <p className="mt-1 text-2xl font-semibold">{heldSeatLabels} <span className="text-zinc-500">·</span> ৳{holdPrice}</p>
        </div>
        <div className={`rounded-lg px-4 py-2 text-center ${expired ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-200"}`}>
          <p className="text-xs uppercase tracking-wider">{expired ? "Hold expired" : "Time remaining"}</p>
          <p className="font-mono text-2xl font-bold" data-testid="hold-countdown">{countdown.formatted}</p>
        </div>
      </div>

      {expired ? (
        <div className="mt-5"><InlineNotice>Your hold expired. Checkout is disabled and the seat map has been refreshed.</InlineNotice></div>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-300">Phone number</span>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(event) => { setPhone(event.target.value); setVerificationToken("") }}
                disabled={locked || verificationToken}
                placeholder="+880 1712 345678"
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => requestOtp(otpRequested ? "resend" : "request")}
                disabled={locked || !phone || verificationToken}
                className="rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyAction === "request" || busyAction === "resend" ? "Sending…" : otpRequested ? "Resend OTP" : "Request OTP"}
              </button>
            </div>
          </label>

          {otpRequested && !verificationToken && (
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">One-time password</span>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  disabled={locked}
                  placeholder="6-digit OTP"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 tracking-[0.3em] outline-none focus:border-zinc-500 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={locked || otp.length !== 6}
                  className="rounded-lg border border-zinc-600 px-4 py-3 font-semibold hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyAction === "verify" ? "Verifying…" : "Verify OTP"}
                </button>
              </div>
              {demoOtp && <span className="mt-2 block text-xs text-zinc-500">Demo OTP: <span className="font-mono text-zinc-300">{demoOtp}</span></span>}
            </label>
          )}

          {message && <InlineNotice tone="success">{message}</InlineNotice>}
          {error && <InlineNotice>{error}</InlineNotice>}

          <button
            type="button"
            onClick={startPayment}
            disabled={locked || !verificationToken}
            className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busyAction === "payment" ? "Starting payment…" : `Pay ৳${holdPrice}`}
          </button>
        </div>
      )}
    </section>
  )
}

export default BookingPanel
