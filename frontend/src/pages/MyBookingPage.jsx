import { useEffect, useState } from "react"
import { Link } from "react-router-dom"


function MyBookingPage() {

  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded] = useState(false)


  /*
   * ---------------------------------------------------------
   * LOAD MOST RECENT SUCCESSFUL BOOKING
   * ---------------------------------------------------------
   */
  useEffect(() => {

    try {

      const storedBooking =
        window.localStorage.getItem(
          "cinemaseat:last-booking",
        )


      if (storedBooking) {

        setBooking(
          JSON.parse(storedBooking),
        )

      }

    } catch {

      /*
       * Invalid localStorage data should never crash
       * the page.
       */
      setBooking(null)

    } finally {

      setLoaded(true)

    }

  }, [])


  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (!loaded) {

    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">

        <div
          className="
            h-80
            animate-pulse
            rounded-2xl
            bg-zinc-900
          "
        />

      </main>
    )
  }


  /*
   * ---------------------------------------------------------
   * NO BOOKING
   * ---------------------------------------------------------
   */
  if (!booking) {

    return (
      <main
        className="
          mx-auto
          flex
          min-h-[65vh]
          max-w-xl
          flex-col
          items-center
          justify-center
          px-6
          text-center
        "
      >

        <div
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-zinc-900
            text-2xl
          "
        >
          🎟️
        </div>


        <p
          className="
            mt-6
            text-xs
            font-semibold
            uppercase
            tracking-[0.25em]
            text-zinc-600
          "
        >
          My Booking
        </p>


        <h1 className="mt-2 text-3xl font-bold">
          No booking yet
        </h1>


        <p className="mt-3 max-w-md leading-7 text-zinc-400">
          Your latest confirmed CinemaSeat booking will
          appear here.
        </p>


        <Link
          to="/"
          className="
            mt-8
            rounded-lg
            bg-white
            px-5
            py-3
            font-semibold
            text-black
            transition
            hover:bg-zinc-200
          "
        >
          Find a movie
        </Link>

      </main>
    )
  }


  const seatLabels =
    booking.seatLabels?.length
      ? booking.seatLabels
      : ["—"]


  const completedDate =
    booking.completedAt
      ? new Date(
          booking.completedAt,
        )
      : null


  /*
   * ---------------------------------------------------------
   * CONFIRMED BOOKING
   * ---------------------------------------------------------
   */
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">


      {/* HEADER */}
      <div>

        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.25em]
            text-zinc-500
          "
        >
          My Booking
        </p>


        <h1 className="mt-2 text-4xl font-bold">
          Your latest ticket
        </h1>


        <p className="mt-3 text-zinc-400">
          Keep this booking reference available when
          entering the cinema.
        </p>

      </div>


      {/* TICKET */}
      <section
        className="
          mt-10
          overflow-hidden
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
          shadow-2xl
        "
      >


        {/* TICKET HEADER */}
        <div
          className="
            flex
            flex-col
            justify-between
            gap-4
            border-b
            border-dashed
            border-zinc-700
            bg-zinc-950
            px-6
            py-6
            sm:flex-row
            sm:items-center
          "
        >

          <div>

            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.3em]
                text-zinc-500
              "
            >
              CinemaSeat
            </p>


            <p className="mt-1 text-xl font-semibold">
              Movie Ticket
            </p>

          </div>


          <span
            className="
              w-fit
              rounded-full
              bg-emerald-500/15
              px-4
              py-2
              text-xs
              font-bold
              tracking-wider
              text-emerald-300
            "
          >
            CONFIRMED
          </span>

        </div>


        {/* BOOKING DATA */}
        <div
          className="
            grid
            gap-8
            px-6
            py-8
            sm:grid-cols-2
          "
        >

          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-wider
                text-zinc-600
              "
            >
              {seatLabels.length === 1
                ? "Seat"
                : "Seats"}
            </p>


            <p className="mt-2 text-2xl font-semibold">
              {seatLabels.join(", ")}
            </p>

          </div>


          <div className="sm:text-right">

            <p
              className="
                text-xs
                uppercase
                tracking-wider
                text-zinc-600
              "
            >
              Amount paid
            </p>


            <p className="mt-2 text-2xl font-semibold">
              ৳{booking.amount ?? 0}
            </p>

          </div>


          {completedDate && (

            <div>

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wider
                  text-zinc-600
                "
              >
                Booked
              </p>


              <p className="mt-2 text-zinc-300">
                {completedDate.toLocaleString()}
              </p>

            </div>

          )}

        </div>


        {/* BOOKING REFERENCE */}
        <div
          className="
            border-t
            border-zinc-800
            bg-zinc-950/50
            px-6
            py-6
          "
        >

          <p
            className="
              text-xs
              uppercase
              tracking-[0.15em]
              text-zinc-600
            "
          >
            Booking reference
          </p>


          <div
            className="
              mt-3
              flex
              flex-col
              justify-between
              gap-4
              sm:flex-row
              sm:items-center
            "
          >

            <p
              className="
                break-all
                font-mono
                text-xl
                font-semibold
                tracking-wide
              "
            >
              {booking.bookingReference}
            </p>


            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(
                  booking.bookingReference,
                )
              }}
              className="
                w-fit
                rounded-lg
                border
                border-zinc-700
                px-4
                py-2
                text-sm
                text-zinc-300
                transition
                hover:border-zinc-500
                hover:bg-zinc-900
              "
            >
              Copy reference
            </button>

          </div>

        </div>

      </section>


      <div className="mt-8 text-center">

        <Link
          to="/"
          className="
            text-sm
            font-medium
            text-zinc-400
            transition
            hover:text-white
          "
        >
          ← Browse more movies
        </Link>

      </div>

    </main>
  )
}

export default MyBookingPage