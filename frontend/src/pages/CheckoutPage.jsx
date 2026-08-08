import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const booking = location.state

  const [timeLeft, setTimeLeft] = useState(60)
  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          clearInterval(timer)
          return 0
        }

        return currentTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!booking) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <p className="text-center text-zinc-400">
          No seat selected.
        </p>
      </main>
    )
  }

  const handleSendOtp = () => {
    if (!phone) return

    setOtpSent(true)
  }

  const handlePayment = () => {
    if (!otp) return

    navigate("/booking/success", {
      state: booking,
    })
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">

      <div className="mb-8">

        <p className="text-sm uppercase tracking-widest text-zinc-500">
          Checkout
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Complete your booking
        </h1>

      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

        <div className="border-b border-zinc-800 pb-6">

          <h2 className="text-xl font-semibold">
            {booking.movie}
          </h2>

          <p className="mt-2 text-zinc-400">
            {booking.theatre} • {booking.showtime}
          </p>

        </div>


        <div className="flex items-center justify-between border-b border-zinc-800 py-6">

          <div>

            <p className="text-sm text-zinc-400">
              Seat
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {booking.seat.label}
            </p>

          </div>

          <div className="text-right">

            <p className="text-sm text-zinc-400">
              Price
            </p>

            <p className="mt-1 text-2xl font-semibold">
              ৳{booking.seat.price}
            </p>

          </div>

        </div>


        <div className="py-6">

          <p className="text-sm text-zinc-400">
            Seat hold expires in
          </p>

          <p className={`mt-2 text-2xl font-bold ${
            timeLeft <= 10
              ? "text-red-400"
              : "text-white"
          }`}>
            00:{String(timeLeft).padStart(2, "0")}
          </p>

        </div>


        {timeLeft === 0 ? (

          <div className="rounded-lg bg-red-500/10 p-4 text-red-400">
            Your seat hold has expired.
          </div>

        ) : (

          <>
            <label className="block text-sm text-zinc-400">
              Phone number
            </label>

            <div className="mt-2 flex gap-3">

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="01XXXXXXXXX"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500"
              />

              <button
                onClick={handleSendOtp}
                className="rounded-lg border border-zinc-700 px-4 py-3 hover:bg-zinc-800"
              >
                Send OTP
              </button>

            </div>


            {otpSent && (

              <div className="mt-5">

                <label className="block text-sm text-zinc-400">
                  OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value)
                  }
                  placeholder="Enter OTP"
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500"
                />

              </div>

            )}


            <button
              onClick={handlePayment}
              disabled={!otpSent || !otp}
              className="mt-6 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Pay ৳{booking.seat.price}
            </button>

          </>

        )}

      </div>

    </main>
  )
}

export default CheckoutPage