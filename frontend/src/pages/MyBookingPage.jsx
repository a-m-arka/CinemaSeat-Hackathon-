import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import apiClient, { apiErrorMessage } from "../api/client";
import InlineNotice from "../components/InlineNotice";

function MyBookingPage() {
  const [booking, setBooking] = useState(() => {
    try {
      const storedBooking = window.localStorage.getItem(
        "cinemaseat:last-booking",
      );
      return storedBooking ? JSON.parse(storedBooking) : null;
    } catch {
      return null;
    }
  });

  const [cancelStep, setCancelStep] = useState("idle");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const cancelInFlight = useRef(false);
  const bookingReference = booking?.bookingReference;

  useEffect(() => {
    if (!bookingReference) return undefined;
    let active = true;

    async function refreshBooking() {
      try {
        const { data } = await apiClient.get(
          `/bookings/${encodeURIComponent(bookingReference)}`,
        );
        if (!active || !data.booking) return;
        setBooking((current) => {
          const nextBooking = {
            ...current,
            ...data.booking,
            status:
              data.booking.bookingStatus ||
              data.booking.status ||
              current?.status,
          };
          window.localStorage.setItem(
            "cinemaseat:last-booking",
            JSON.stringify(nextBooking),
          );
          return nextBooking;
        });
      } catch {
        // The cached ticket remains usable if booking refresh is temporarily unavailable.
      }
    }

    refreshBooking();
    return () => {
      active = false;
    };
  }, [bookingReference]);

  async function cancelBooking() {
    if (cancelInFlight.current || !booking) return;
    cancelInFlight.current = true;
    setCancelBusy(true);
    setCancelError("");

    try {
      const bookingKey = booking.bookingReference || booking.paymentId;
      const { data } = await apiClient.post(
        `/bookings/${encodeURIComponent(bookingKey)}/cancel`,
      );
      const cancelledBooking = data.booking || data.payment || {};
      const nextBooking = {
        ...booking,
        ...cancelledBooking,
        status: cancelledBooking.bookingStatus || "CANCELLED",
        cancelledAt: cancelledBooking.cancelledAt || new Date().toISOString(),
        refundStatus: cancelledBooking.refundStatus || "PROCESSING",
      };

      setBooking(nextBooking);
      setCancelStep("complete");
      window.localStorage.setItem(
        "cinemaseat:last-booking",
        JSON.stringify(nextBooking),
      );
      if (nextBooking.showId) {
        window.localStorage.removeItem(`cinemaseat:hold:${nextBooking.showId}`);
        window.localStorage.removeItem(
          `cinemaseat:payment:${nextBooking.showId}`,
        );
      }
    } catch (error) {
      setCancelError(
        apiErrorMessage(error, "The booking could not be cancelled."),
      );
    } finally {
      cancelInFlight.current = false;
      setCancelBusy(false);
    }
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
          max-w-3xl
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
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            border border-violet-400/20
            bg-violet-500/10
            text-3xl
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
          Profile & tickets
        </p>

        <h1 className="mt-3 text-4xl font-black sm:text-6xl">No booking yet</h1>

        <p className="mt-3 max-w-md leading-7 text-zinc-400">
          Your latest confirmed CinemaSeat booking will appear here.
        </p>

        <Link
          to="/"
          className="
            mt-8
            rounded-2xl
            bg-gradient-to-r
            from-violet-500
            to-fuchsia-500
            px-7
            py-4
            font-bold
            text-white
            transition
            hover:brightness-110
          "
        >
          Find a movie
        </Link>
      </main>
    );
  }

  const seatLabels = booking.seatLabels?.length ? booking.seatLabels : ["—"];

  const completedDate = booking.completedAt
    ? new Date(booking.completedAt)
    : null;

  const movieTitle = booking.movieTitle || booking.movie || "Your movie";
  const cinemaHall = booking.theatre || booking.hall || "—";
  const showTime = booking.showTime || booking.showtime || "—";
  const showDate = booking.showDate || "Today";
  const moviePoster = booking.moviePoster || "";
  const storedBookingStatus =
    booking.bookingStatus || booking.status || "CONFIRMED";
  const bookingStatus =
    storedBookingStatus === "SUCCEEDED" ? "CONFIRMED" : storedBookingStatus;
  const isCancelled = bookingStatus === "CANCELLED";
  const cancelledDate = booking.cancelledAt
    ? new Date(booking.cancelledAt)
    : null;
  const profilePhone = booking.phone
    ? booking.phone.replace(/.(?=.{4})/g, "•")
    : "Guest checkout";
  const bookedSeats = booking.seats?.length ? booking.seats : [];

  /*
   * ---------------------------------------------------------
   * CONFIRMED BOOKING
   * ---------------------------------------------------------
   */
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
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
          Account overview
        </p>

        <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">
          Profile & tickets
        </h1>

        <p className="mt-3 text-zinc-400">
          Manage your latest CinemaSeat booking, ticket details, and
          cancellation status.
        </p>
      </div>

      <section className="premium-panel mt-8 grid gap-6 rounded-[2rem] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-black shadow-[0_15px_40px_rgba(139,92,246,0.25)]">
            GU
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
              CinemaSeat profile
            </p>
            <h2 className="mt-1 text-2xl font-black">Guest moviegoer</h2>
            <p className="mt-1 text-sm text-zinc-500">{profilePhone}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.035] px-5 py-4">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">
              Tickets
            </dt>
            <dd className="mt-1 text-2xl font-black">{seatLabels.length}</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.035] px-5 py-4">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">
              Bookings
            </dt>
            <dd className="mt-1 text-2xl font-black">1</dd>
          </div>
          <div className="col-span-2 rounded-2xl bg-white/[0.035] px-5 py-4 sm:col-span-1">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">
              Status
            </dt>
            <dd
              className={`mt-1 text-sm font-black ${isCancelled ? "text-rose-300" : "text-emerald-300"}`}
            >
              {bookingStatus}
            </dd>
          </div>
        </dl>
      </section>

      {/* TICKET */}
      <section
        className="
          mt-10
          overflow-hidden
          ticket-card
          rounded-[2.5rem]
          border
          border-white/10
          bg-gradient-to-br
          from-[#181821]
          to-[#0d0d13]
          shadow-[0_35px_100px_rgba(0,0,0,0.4)]
        "
      >
        {/* TICKET HEADER */}
        <div
          className={`
            flex
            flex-col
            justify-between
            gap-4
            border-b
            border-dashed
            border-zinc-700
            ${isCancelled ? "bg-rose-500/10" : "bg-violet-500/10"}
            px-8
            py-8
            sm:flex-row
            sm:items-center
          `}
        >
          <div className="flex items-center gap-4">
            {moviePoster && (
              <img
                src={moviePoster}
                alt=""
                className="h-16 w-12 rounded-lg object-cover shadow-xl"
              />
            )}

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

              <p className="mt-1 text-xl font-semibold">Movie Ticket</p>
            </div>
          </div>

          <span
            className={`
              w-fit
              rounded-full
              px-4
              py-2
              text-xs
              font-bold
              tracking-wider
              ${isCancelled ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}
            `}
          >
            {bookingStatus}
          </span>
        </div>

        {/* BOOKING DATA */}
        <div
          className="
            grid
            gap-8
            px-8
            py-10
            sm:grid-cols-2
          "
        >
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Movie
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {movieTitle}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Cinema hall
            </p>
            <p className="mt-2 text-xl font-bold text-violet-200">
              {cinemaHall}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Show time
            </p>
            <p className="mt-2 text-xl font-bold text-violet-200">{showTime}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Show date
            </p>
            <p className="mt-2 font-semibold text-zinc-300">{showDate}</p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-zinc-600">
              Admission
            </p>
            <p className="mt-2 font-semibold text-zinc-300">
              {seatLabels.length} {seatLabels.length === 1 ? "guest" : "guests"}
            </p>
          </div>

          <div>
            <p
              className="
                text-xs
                uppercase
                tracking-wider
                text-zinc-600
              "
            >
              {seatLabels.length === 1 ? "Seat" : "Seats"}
            </p>

            <p className="mt-3 text-4xl font-black text-violet-200">
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

            <p className="mt-3 text-4xl font-black">৳{booking.amount ?? 0}</p>
          </div>

          {bookedSeats.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Seat class breakdown
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {bookedSeats.map((seat) => (
                  <div
                    key={seat.id || seat.label}
                    className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3 text-sm"
                  >
                    <span>
                      <strong className="text-zinc-200">{seat.label}</strong>
                      <span className="ml-2 text-zinc-500">
                        {seat.tier || "Standard"}
                      </span>
                    </span>
                    <span className="font-bold text-violet-300">
                      ৳{seat.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedDate && (
            <div className="sm:col-span-2">
              <p
                className="
                  text-xs
                  uppercase
                  tracking-wider
                  text-zinc-600
                "
              >
                Booked on
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
            bg-black/20
            px-8
            py-8
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
                text-2xl
                font-black
                tracking-wide
              "
            >
              {booking.bookingReference}
            </p>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(booking.bookingReference);
              }}
              className="
                w-fit
                rounded-xl
                border
                border-violet-400/20
                bg-violet-500/10
                px-5
                py-3
                text-sm
                text-zinc-300
                transition
                hover:border-violet-400/40
                hover:bg-violet-500/20
              "
            >
              Copy reference
            </button>
          </div>
        </div>
      </section>

      {!isCancelled ? (
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">
                Ticket management
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Need to change your plans?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Cancellation releases every seat in this booking. Refund
                eligibility and timing are determined by the cinema&apos;s
                policy.
              </p>
            </div>

            {cancelStep === "idle" && (
              <button
                type="button"
                onClick={() => setCancelStep("confirm")}
                className="shrink-0 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-6 py-3 font-bold text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-500/15"
              >
                Cancel ticket
              </button>
            )}
          </div>

          {cancelError && (
            <div className="mt-5">
              <InlineNotice>{cancelError}</InlineNotice>
            </div>
          )}

          {cancelStep === "confirm" && (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-5">
              <p className="font-bold text-rose-200">
                Cancel {seatLabels.length}{" "}
                {seatLabels.length === 1 ? "ticket" : "tickets"} for{" "}
                {movieTitle}?
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Seats {seatLabels.join(", ")} will immediately return to the
                live seat map. This action cannot be undone.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancelBooking}
                  disabled={cancelBusy}
                  className="rounded-xl bg-rose-500 px-5 py-3 font-bold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelBusy ? "Cancelling…" : "Yes, cancel booking"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancelStep("idle");
                    setCancelError("");
                  }}
                  disabled={cancelBusy}
                  className="rounded-xl border border-white/10 px-5 py-3 font-bold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Keep my ticket
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section
          className="mt-8 rounded-[2rem] border border-rose-400/20 bg-rose-500/[0.06] p-6 sm:p-8"
          aria-live="polite"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
            Cancellation complete
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Your seats have been released
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-zinc-600">Cancelled on</p>
              <p className="mt-1 font-semibold">
                {cancelledDate ? cancelledDate.toLocaleString() : "Recorded"}
              </p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-zinc-600">Refund status</p>
              <p className="mt-1 font-semibold text-amber-300">
                {booking.refundStatus || "PROCESSING"}
              </p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-zinc-600">Refund amount</p>
              <p className="mt-1 font-semibold">
                ৳{booking.refundAmount ?? booking.amount ?? 0}
              </p>
            </div>
          </div>
        </section>
      )}

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
  );
}

export default MyBookingPage;
