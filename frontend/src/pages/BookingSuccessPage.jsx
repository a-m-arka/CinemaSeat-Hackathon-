import { Link, useLocation } from "react-router-dom"

function BookingSuccessPage() {
  const location = useLocation()

  const booking = location.state

  return (
    <main className="mx-auto max-w-xl px-6 py-20">

      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-8 text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl">
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-bold">
          Booking confirmed
        </h1>

        <p className="mt-3 text-zinc-400">
          Your seat has been successfully booked.
        </p>

        {booking && (

          <div className="mt-8 rounded-xl bg-zinc-950/50 p-5 text-left">

            <p className="text-zinc-400">
              Movie
            </p>

            <p className="font-semibold">
              {booking.movie}
            </p>


            <div className="mt-4 flex justify-between">

              <div>

                <p className="text-sm text-zinc-400">
                  Seat
                </p>

                <p className="font-semibold">
                  {booking.seat.label}
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm text-zinc-400">
                  Amount
                </p>

                <p className="font-semibold">
                  ৳{booking.seat.price}
                </p>

              </div>

            </div>

          </div>

        )}


        <Link
          to="/"
          className="mt-8 block rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-zinc-200"
        >
          Back to Movies
        </Link>

      </div>

    </main>
  )
}

export default BookingSuccessPage