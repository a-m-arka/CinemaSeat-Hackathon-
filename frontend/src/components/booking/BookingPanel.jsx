import { useEffect, useRef, useState } from "react"

import apiClient, { apiErrorMessage } from "../../api/client"
import InlineNotice from "../InlineNotice"


function PaymentStep({ status, children }) {
  const styles = {
    complete: {
      circle: "bg-emerald-400 text-emerald-950",
      text: "text-zinc-300",
      icon: "✓",
    },

    active: {
      circle: "bg-white text-black",
      text: "text-white",
      icon: "●",
    },

    waiting: {
      circle: "bg-zinc-800 text-zinc-500",
      text: "text-zinc-600",
      icon: "○",
    },

    failed: {
      circle: "bg-red-500/20 text-red-300",
      text: "text-red-300",
      icon: "!",
    },
  }

  const style = styles[status]

  return (
    <div className="flex items-center gap-3">

      <div
        className={`
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-full
          text-xs
          font-bold
          ${style.circle}
          ${status === "active" ? "animate-pulse" : ""}
        `}
      >
        {style.icon}
      </div>

      <p className={`text-sm ${style.text}`}>
        {children}
      </p>

    </div>
  )
}


function BookingPanel({
  hold,
  countdown,
  payment,
  paymentPollError,
  onPaymentStarted,
}) {

  const [phone, setPhone] = useState(hold.phone || "")
  const [otp, setOtp] = useState("")

  const [otpRequested, setOtpRequested] = useState(
    Boolean(hold.phone),
  )

  const [verificationToken, setVerificationToken] =
    useState("")

  const [demoOtp, setDemoOtp] = useState("")

  const [busyAction, setBusyAction] = useState("")

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const actionInFlight = useRef(false)


  /*
   * ---------------------------------------------------------
   * COMPUTED BOOKING INFORMATION
   * ---------------------------------------------------------
   */

  const holdSeatLabels =
    hold.seatLabels?.length
      ? hold.seatLabels
      : hold.seatLabel
        ? [hold.seatLabel]
        : []

  const heldSeatLabels = holdSeatLabels.join(", ")

  const holdPrice =
    hold.totalPrice ??
    hold.price ??
    payment?.amount ??
    0


  const expired =
    hold.status !== "ACTIVE" ||
    countdown.remainingMs <= 0


  const locked =
    Boolean(busyAction) ||
    expired ||
    payment?.status === "PENDING"


  /*
   * ---------------------------------------------------------
   * SAVE SUCCESSFUL BOOKING LOCALLY
   * ---------------------------------------------------------
   *
   * This gives us data for a future "My Booking" page.
   */
  useEffect(() => {

    if (
      payment?.status !== "SUCCEEDED" ||
      !payment.bookingReference
    ) {
      return
    }

    const booking = {
      bookingReference:
        payment.bookingReference,

      seatLabels:
        payment.seatLabels ||
        (
          payment.seatLabel
            ? [payment.seatLabel]
            : holdSeatLabels
        ),

      amount:
        payment.amount ?? holdPrice,

      completedAt:
        new Date().toISOString(),
    }

    window.localStorage.setItem(
      "cinemaseat:last-booking",
      JSON.stringify(booking),
    )

  }, [
    holdPrice,
    holdSeatLabels,
    payment,
  ])


  /*
   * ---------------------------------------------------------
   * REQUEST / RESEND OTP
   * ---------------------------------------------------------
   */

  async function requestOtp(mode) {

    if (
      actionInFlight.current ||
      expired ||
      !phone.trim()
    ) {
      return
    }


    actionInFlight.current = true

    setBusyAction(mode)
    setError("")
    setMessage("")


    try {

      const { data } =
        await apiClient.post(
          `/holds/${hold.id}/otp/${mode}`,
          {
            phone: phone.trim(),
          },
        )


      setOtpRequested(true)

      setVerificationToken("")

      setDemoOtp(
        data.developmentOtp || "",
      )


      setMessage(
        mode === "resend"
          ? "A new OTP was sent."
          : "OTP sent to your phone.",
      )

    } catch (requestError) {

      setError(
        apiErrorMessage(
          requestError,
          "Could not send the OTP.",
        ),
      )

    } finally {

      actionInFlight.current = false
      setBusyAction("")

    }
  }


  /*
   * ---------------------------------------------------------
   * VERIFY OTP
   * ---------------------------------------------------------
   */

  async function verifyOtp() {

    if (
      actionInFlight.current ||
      expired ||
      otp.length !== 6
    ) {
      return
    }


    actionInFlight.current = true

    setBusyAction("verify")
    setError("")
    setMessage("")


    try {

      const { data } =
        await apiClient.post(
          `/holds/${hold.id}/otp/verify`,
          {
            phone: phone.trim(),
            code: otp,
          },
        )


      setVerificationToken(
        data.verificationToken,
      )


      setMessage(
        "Phone verified. You can now start payment.",
      )

    } catch (verifyError) {

      setError(
        apiErrorMessage(
          verifyError,
          "OTP verification failed.",
        ),
      )

    } finally {

      actionInFlight.current = false
      setBusyAction("")

    }
  }


  /*
   * ---------------------------------------------------------
   * START PAYMENT
   * ---------------------------------------------------------
   */

  async function startPayment() {

    if (
      actionInFlight.current ||
      expired ||
      !verificationToken
    ) {
      return
    }


    actionInFlight.current = true

    setBusyAction("payment")
    setError("")
    setMessage("")


    try {

      const { data } =
        await apiClient.post(
          "/payments",
          {
            holdId: hold.id,
            phone: phone.trim(),
            verificationToken,
          },
        )


      onPaymentStarted(
        data.payment,
      )

    } catch (paymentError) {

      setError(
        apiErrorMessage(
          paymentError,
          "Payment could not be started.",
        ),
      )

    } finally {

      actionInFlight.current = false
      setBusyAction("")

    }
  }


  /*
   * =========================================================
   * PAYMENT SUCCESS
   * =========================================================
   */

  if (payment?.status === "SUCCEEDED") {

    const successfulSeats =
      payment.seatLabels?.length
        ? payment.seatLabels
        : payment.seatLabel
          ? [payment.seatLabel]
          : holdSeatLabels


    return (
      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-emerald-500/20
          bg-zinc-900
        "
        aria-live="polite"
      >

        {/* SUCCESS HEADER */}
        <div
          className="
            border-b
            border-emerald-500/10
            bg-emerald-500/10
            px-6
            py-8
            text-center
          "
        >

          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-emerald-400
              text-3xl
              font-bold
              text-emerald-950
            "
          >
            ✓
          </div>


          <p
            className="
              mt-5
              text-xs
              font-semibold
              uppercase
              tracking-[0.25em]
              text-emerald-300
            "
          >
            Payment successful
          </p>


          <h2 className="mt-2 text-3xl font-bold">
            Booking confirmed
          </h2>


          <p className="mt-3 text-zinc-400">
            {successfulSeats.length > 1
              ? "Your seats are officially yours."
              : "Your seat is officially yours."}
          </p>

        </div>


        {/* TICKET */}
        <div className="p-6">

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-zinc-700
              bg-zinc-950
            "
          >

            {/* TICKET TOP */}
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-dashed
                border-zinc-700
                px-5
                py-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.25em]
                    text-zinc-500
                  "
                >
                  CinemaSeat
                </p>

                <p className="mt-1 font-semibold">
                  Movie Ticket
                </p>

              </div>


              <span
                className="
                  rounded-full
                  bg-emerald-500/15
                  px-3
                  py-1.5
                  text-xs
                  font-semibold
                  text-emerald-300
                "
              >
                CONFIRMED
              </span>

            </div>


            {/* TICKET DETAILS */}
            <div className="grid grid-cols-2 gap-6 px-5 py-6">

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-zinc-600
                  "
                >
                  {successfulSeats.length > 1
                    ? "Seats"
                    : "Seat"}
                </p>


                <p className="mt-1 text-xl font-semibold">
                  {successfulSeats.join(", ")}
                </p>

              </div>


              <div className="text-right">

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wider
                    text-zinc-600
                  "
                >
                  Amount
                </p>


                <p className="mt-1 text-xl font-semibold">
                  ৳{payment.amount}
                </p>

              </div>

            </div>


            {/* BOOKING REFERENCE */}
            <div
              className="
                border-t
                border-zinc-800
                bg-zinc-900/60
                px-5
                py-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wider
                  text-zinc-600
                "
              >
                Booking reference
              </p>


              <p
                className="
                  mt-2
                  break-all
                  font-mono
                  text-lg
                  font-semibold
                  tracking-wide
                  text-zinc-200
                "
              >
                {payment.bookingReference}
              </p>

            </div>

          </div>


          <p className="mt-5 text-center text-xs leading-5 text-zinc-600">
            Keep your booking reference. You may need it
            when entering the cinema.
          </p>

        </div>

      </section>
    )
  }


  /*
   * =========================================================
   * PAYMENT FAILED
   * =========================================================
   */

  if (payment?.status === "FAILED") {

    return (
      <section
        className="
          rounded-2xl
          border
          border-red-500/20
          bg-zinc-900
          p-6
        "
        aria-live="assertive"
      >

        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-red-500/15
            text-xl
            font-bold
            text-red-300
          "
        >
          !
        </div>


        <p
          className="
            mt-5
            text-xs
            font-semibold
            uppercase
            tracking-[0.2em]
            text-red-300
          "
        >
          Payment failed
        </p>


        <h2 className="mt-2 text-2xl font-bold">
          We could not complete your booking
        </h2>


        <p className="mt-3 leading-6 text-zinc-400">
          {payment.error ||
            "The gateway declined the payment. No booking was made."}
        </p>


        {/* FAILED PROGRESS */}
        <div
          className="
            mt-7
            space-y-4
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-5
          "
        >

          <PaymentStep status="complete">
            Seat hold created
          </PaymentStep>

          <PaymentStep status="complete">
            Phone verified
          </PaymentStep>

          <PaymentStep status="failed">
            Payment failed
          </PaymentStep>

          <PaymentStep status="waiting">
            Booking confirmation
          </PaymentStep>

        </div>


        <InlineNotice tone="warning">
          Choose an available seat again to retry.
        </InlineNotice>

      </section>
    )
  }


  /*
   * =========================================================
   * PAYMENT PENDING
   * =========================================================
   */

  if (payment?.status === "PENDING") {

    return (
      <section
        className="
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900
          p-6
        "
        aria-live="polite"
      >

        <div className="flex items-start gap-4">

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/10
            "
          >

            <div
              className="
                h-5
                w-5
                animate-spin
                rounded-full
                border-2
                border-zinc-600
                border-t-white
              "
            />

          </div>


          <div>

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-zinc-500
              "
            >
              Payment processing
            </p>


            <h2 className="mt-1 text-2xl font-bold">
              Waiting for the gateway
            </h2>


            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Keep this page open. CinemaSeat will update
              automatically when payment is confirmed.
            </p>

          </div>

        </div>


        {/* PAYMENT PROGRESS */}
        <div
          className="
            mt-7
            space-y-4
            rounded-xl
            border
            border-zinc-800
            bg-zinc-950
            p-5
          "
        >

          <PaymentStep status="complete">
            Seat hold created
          </PaymentStep>

          <PaymentStep status="complete">
            Phone verified
          </PaymentStep>

          <PaymentStep status="active">
            Waiting for payment confirmation
          </PaymentStep>

          <PaymentStep status="waiting">
            Confirm booking
          </PaymentStep>

        </div>


        {paymentPollError && (

          <div className="mt-5">

            <InlineNotice tone="warning">
              {paymentPollError} Retrying automatically…
            </InlineNotice>

          </div>

        )}


        <p className="mt-5 text-center text-xs text-zinc-600">
          If you refresh this page, CinemaSeat will attempt
          to recover the payment automatically.
        </p>

      </section>
    )
  }


  /*
   * =========================================================
   * ACTIVE HOLD / CHECKOUT
   * =========================================================
   */

  return (
    <section
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-5
        sm:p-6
      "
    >

      {/* HOLD SUMMARY */}
      <div
        className="
          flex
          flex-col
          justify-between
          gap-4
          border-b
          border-zinc-800
          pb-5
          sm:flex-row
          sm:items-center
        "
      >

        <div>

          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.2em]
              text-zinc-500
            "
          >
            Your held{" "}
            {holdSeatLabels.length > 1
              ? "seats"
              : "seat"}
          </p>


          <p className="mt-2 text-xl font-semibold">
            {heldSeatLabels}
          </p>


          <p className="mt-1 text-sm text-zinc-500">
            Total ৳{holdPrice}
          </p>

        </div>


        {/* COUNTDOWN */}
        <div
          className={`
            rounded-xl
            px-5
            py-3
            text-center
            ${
              expired
                ? "bg-red-500/15 text-red-300"
                : countdown.remainingMs <= 30000
                  ? "bg-red-500/15 text-red-300"
                  : "bg-amber-500/15 text-amber-200"
            }
          `}
        >

          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-wider
              opacity-70
            "
          >
            {expired
              ? "Hold expired"
              : "Time remaining"}
          </p>


          <p
            className="
              mt-1
              font-mono
              text-2xl
              font-bold
              tracking-wider
            "
          >
            {countdown.formatted}
          </p>

        </div>

      </div>


      {expired ? (

        <div className="mt-5">

          <InlineNotice>
            Your hold expired. Checkout is disabled and the
            seat map has been refreshed.
          </InlineNotice>

        </div>

      ) : (

        <div className="mt-6 space-y-5">


          {/* CHECKOUT PROGRESS */}
          <div className="grid grid-cols-3 gap-2">

            <div
              className={`
                rounded-lg
                border
                px-3
                py-2
                text-center
                text-xs
                ${
                  otpRequested
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400"
                }
              `}
            >
              1. OTP
            </div>


            <div
              className={`
                rounded-lg
                border
                px-3
                py-2
                text-center
                text-xs
                ${
                  verificationToken
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 bg-zinc-950 text-zinc-500"
                }
              `}
            >
              2. Verify
            </div>


            <div
              className="
                rounded-lg
                border
                border-zinc-700
                bg-zinc-950
                px-3
                py-2
                text-center
                text-xs
                text-zinc-500
              "
            >
              3. Pay
            </div>

          </div>


          {/* PHONE */}
          <label className="block">

            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Phone number
            </span>


            <div className="flex flex-col gap-2 sm:flex-row">

              <input
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setVerificationToken("")
                  setOtp("")
                }}
                disabled={
                  locked ||
                  Boolean(verificationToken)
                }
                placeholder="+880 1712 345678"
                autoComplete="tel"
                className="
                  min-w-0
                  flex-1
                  rounded-lg
                  border
                  border-zinc-700
                  bg-zinc-950
                  px-4
                  py-3
                  outline-none
                  transition
                  placeholder:text-zinc-700
                  focus:border-zinc-500
                  focus:ring-1
                  focus:ring-zinc-500
                  disabled:opacity-60
                "
              />


              <button
                type="button"
                onClick={() =>
                  requestOtp(
                    otpRequested
                      ? "resend"
                      : "request",
                  )
                }
                disabled={
                  locked ||
                  !phone.trim() ||
                  Boolean(verificationToken)
                }
                className="
                  rounded-lg
                  bg-white
                  px-5
                  py-3
                  font-semibold
                  text-black
                  transition
                  hover:bg-zinc-200
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white
                "
              >
                {busyAction === "request" ||
                busyAction === "resend"
                  ? "Sending…"
                  : otpRequested
                    ? "Resend OTP"
                    : "Request OTP"}
              </button>

            </div>

          </label>


          {/* OTP */}
          {otpRequested &&
            !verificationToken && (

              <label className="block">

                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  One-time password
                </span>


                <div className="flex flex-col gap-2 sm:flex-row">

                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(event) =>
                      setOtp(
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    disabled={locked}
                    placeholder="6-digit OTP"
                    className="
                      min-w-0
                      flex-1
                      rounded-lg
                      border
                      border-zinc-700
                      bg-zinc-950
                      px-4
                      py-3
                      tracking-[0.3em]
                      outline-none
                      transition
                      placeholder:tracking-normal
                      placeholder:text-zinc-700
                      focus:border-zinc-500
                      focus:ring-1
                      focus:ring-zinc-500
                      disabled:opacity-60
                    "
                  />


                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={
                      locked ||
                      otp.length !== 6
                    }
                    className="
                      rounded-lg
                      border
                      border-zinc-600
                      px-5
                      py-3
                      font-semibold
                      transition
                      hover:border-zinc-400
                      hover:bg-zinc-800
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {busyAction === "verify"
                      ? "Verifying…"
                      : "Verify OTP"}
                  </button>

                </div>


                {demoOtp && (

                  <span className="mt-2 block text-xs text-zinc-500">

                    Demo OTP:{" "}

                    <span className="font-mono font-semibold text-zinc-300">
                      {demoOtp}
                    </span>

                  </span>

                )}

              </label>

            )}


          {/* VERIFIED MESSAGE */}
          {verificationToken && (

            <div
              className="
                flex
                items-center
                gap-3
                rounded-lg
                border
                border-emerald-500/20
                bg-emerald-500/10
                px-4
                py-3
              "
            >

              <div
                className="
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-400
                  text-xs
                  font-bold
                  text-emerald-950
                "
              >
                ✓
              </div>


              <p className="text-sm text-emerald-300">
                Phone verified successfully.
              </p>

            </div>

          )}


          {/* MESSAGES */}
          {message && (

            <InlineNotice tone="success">
              {message}
            </InlineNotice>

          )}


          {error && (

            <InlineNotice>
              {error}
            </InlineNotice>

          )}


          {/* PAYMENT BUTTON */}
          <button
            type="button"
            onClick={startPayment}
            disabled={
              locked ||
              !verificationToken
            }
            className="
              w-full
              rounded-lg
              bg-emerald-400
              px-4
              py-3.5
              font-bold
              text-emerald-950
              transition
              hover:bg-emerald-300
              disabled:cursor-not-allowed
              disabled:opacity-40
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-300
              focus-visible:ring-offset-2
              focus-visible:ring-offset-zinc-900
            "
          >
            {busyAction === "payment"
              ? "Starting payment…"
              : `Pay ৳${holdPrice}`}
          </button>


          {!verificationToken && (

            <p className="text-center text-xs text-zinc-600">
              Verify your phone number before starting
              payment.
            </p>

          )}

        </div>

      )}

    </section>
  )
}

export default BookingPanel