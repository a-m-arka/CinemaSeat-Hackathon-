import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import apiClient, { apiErrorMessage } from "../api/client";
import BookingPanel from "../components/booking/BookingPanel";
import InlineNotice from "../components/InlineNotice";
import Seat from "../components/Seat";
import useCountdown from "../hooks/useCountdown";

const holdStorageKey = (showId) => `cinemaseat:hold:${showId}`;
const paymentStorageKey = (showId) => `cinemaseat:payment:${showId}`;

const AUTO_REFRESH_INTERVAL = 5000;

function SeatSelectionPage() {
  const { showId } = useParams();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeTier, setActiveTier] = useState("ALL");

  const [hold, setHold] = useState(null);
  const [payment, setPayment] = useState(null);

  const [holdingSeatId, setHoldingSeatId] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentPollError, setPaymentPollError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const expirationHandled = useRef("");
  const holdRequestInFlight = useRef(false);

  const countdown = useCountdown(hold?.expiresAt);

  /*
   * ---------------------------------------------------------
   * LOAD SEAT MAP
   * ---------------------------------------------------------
   *
   * Normal load:
   * Shows the large loading skeleton.
   *
   * Silent load:
   * Used by auto-refresh/manual refresh without destroying
   * the current seat UI.
   */
  const loadSeatMap = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const { data } = await apiClient.get(`/shows/${showId}/seats`);

        setShow(data.show);
        setSeats(data.seats || []);

        /*
         * A selected seat could become unavailable while
         * another user is interacting with the same show.
         *
         * After refreshing, remove any locally-selected
         * seat that is no longer AVAILABLE.
         */
        setSelectedSeats((current) =>
          current.filter((selected) =>
            data.seats?.some(
              (seat) =>
                seat.id === selected.id &&
                seat.status === "AVAILABLE",
            ),
          ),
        );

        setLastUpdated(new Date());
        setError("");
      } catch (loadError) {
        /*
         * On a silent refresh we don't want to destroy an
         * already-visible seat map just because one refresh
         * request failed.
         */
        if (!silent) {
          setError(
            apiErrorMessage(
              loadError,
              "The seat map could not be loaded.",
            ),
          );
        }
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [showId],
  );

  /*
   * ---------------------------------------------------------
   * RECOVER EXISTING CHECKOUT
   * ---------------------------------------------------------
   *
   * If the browser refreshes while a hold/payment exists,
   * localStorage lets the frontend recover it.
   */
  useEffect(() => {
    let active = true;

    async function recoverCheckout() {
      const storedHoldId = window.localStorage.getItem(
        holdStorageKey(showId),
      );

      const storedPaymentId = window.localStorage.getItem(
        paymentStorageKey(showId),
      );

      try {
        const [holdResponse, paymentResponse] = await Promise.all([
          storedHoldId
            ? apiClient
                .get(`/holds/${storedHoldId}`)
                .catch((error) => ({ error }))
            : null,

          storedPaymentId
            ? apiClient
                .get(`/payments/${storedPaymentId}`)
                .catch((error) => ({ error }))
            : null,
        ]);

        if (!active) return;

        /*
         * Recover hold
         */
        if (holdResponse?.data.hold?.status === "ACTIVE") {
          setHold(holdResponse.data.hold);
        } else if (
          storedHoldId &&
          [404, 410].includes(holdResponse?.error?.response?.status)
        ) {
          window.localStorage.removeItem(holdStorageKey(showId));
        }

        /*
         * Recover payment
         */
        if (paymentResponse?.data.payment) {
          setPayment(paymentResponse.data.payment);
        } else if (
          storedPaymentId &&
          [404, 410].includes(paymentResponse?.error?.response?.status)
        ) {
          window.localStorage.removeItem(paymentStorageKey(showId));
        } else if (storedPaymentId && paymentResponse?.error) {
          /*
           * We know a payment existed, but its current status
           * could not be fetched.
           */
          setPayment({
            id: storedPaymentId,
            status: "PENDING",
          });

          setPaymentPollError(
            "The saved payment could not be recovered yet.",
          );
        }
      } finally {
        if (active) {
          loadSeatMap();
        }
      }
    }

    recoverCheckout();

    return () => {
      active = false;
    };
  }, [loadSeatMap, showId]);

  /*
   * ---------------------------------------------------------
   * LIVE SEAT MAP AUTO REFRESH
   * ---------------------------------------------------------
   *
   * Refresh every 5 seconds while the user is browsing seats.
   *
   * We intentionally pause it during an active hold or pending
   * payment so checkout does not constantly redraw underneath
   * the user.
   */
  useEffect(() => {
    if (loading) return undefined;

    if (
      hold?.status === "ACTIVE" ||
      payment?.status === "PENDING"
    ) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadSeatMap({ silent: true });
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    hold?.status,
    loadSeatMap,
    loading,
    payment?.status,
  ]);

  /*
   * ---------------------------------------------------------
   * PAYMENT POLLING
   * ---------------------------------------------------------
   *
   * Payment completion is asynchronous.
   * While payment is PENDING, check its status every 2 seconds.
   */
  useEffect(() => {
    if (payment?.status !== "PENDING") {
      return undefined;
    }

    let active = true;

    async function pollPayment() {
      try {
        const { data } = await apiClient.get(
          `/payments/${payment.id}`,
        );

        if (!active) return;

        setPayment(data.payment);
        setPaymentPollError("");

        if (data.payment.status !== "PENDING") {
          loadSeatMap({ silent: true });
        }
      } catch {
        if (active) {
          setPaymentPollError(
            "The payment status service cannot be reached.",
          );
        }
      }
    }

    const poller = window.setInterval(
      pollPayment,
      2000,
    );

    pollPayment();

    return () => {
      active = false;
      window.clearInterval(poller);
    };
  }, [
    loadSeatMap,
    payment?.id,
    payment?.status,
  ]);

  /*
   * ---------------------------------------------------------
   * HOLD EXPIRATION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (
      !hold ||
      hold.status !== "ACTIVE" ||
      countdown.remainingMs > 0 ||
      expirationHandled.current === hold.id
    ) {
      return;
    }

    expirationHandled.current = hold.id;

    async function confirmExpiration() {
      try {
        const { data } = await apiClient.get(
          `/holds/${hold.id}`,
        );

        setHold(data.hold);

        /*
         * Server still considers it active.
         * Reset the guard and continue.
         */
        if (data.hold.status === "ACTIVE") {
          expirationHandled.current = "";
          return;
        }
      } catch {
        /*
         * If status verification fails after countdown
         * reached zero, show the hold locally as expired.
         */
        setHold((current) =>
          current
            ? {
                ...current,
                status: "EXPIRED",
              }
            : current,
        );
      }

      window.localStorage.removeItem(
        holdStorageKey(showId),
      );

      setNotice(
        "Your hold expired. The seat map has been refreshed.",
      );

      loadSeatMap({ silent: true });
    }

    confirmExpiration();
  }, [
    countdown.remainingMs,
    hold,
    loadSeatMap,
    showId,
  ]);

  /*
   * ---------------------------------------------------------
   * SELECT / DESELECT SEATS
   * ---------------------------------------------------------
   */
  function toggleSeat(seat) {
    /*
     * Lock seat interaction during checkout-related actions.
     */
    if (
      hold?.status === "ACTIVE" ||
      payment?.status === "PENDING" ||
      holdingSeatId
    ) {
      return;
    }

    const alreadySelected = selectedSeats.some(
      (item) => item.id === seat.id,
    );

    /*
     * Maximum 4 seats per booking.
     */
    if (
      !alreadySelected &&
      selectedSeats.length >= 4
    ) {
      setNotice(
        "You can select a maximum of four seats per booking.",
      );
      return;
    }

    setNotice("");

    setSelectedSeats((current) =>
      alreadySelected
        ? current.filter(
            (item) => item.id !== seat.id,
          )
        : [...current, seat],
    );
  }

  /*
   * ---------------------------------------------------------
   * HOLD SELECTED SEATS
   * ---------------------------------------------------------
   */
  async function holdSelectedSeats() {
    if (
      holdRequestInFlight.current ||
      selectedSeats.length === 0 ||
      hold?.status === "ACTIVE" ||
      payment?.status === "PENDING"
    ) {
      return;
    }

    /*
     * Ref guard prevents a fast double-click from creating
     * two simultaneous hold requests before React redraws.
     */
    holdRequestInFlight.current = true;

    setHoldingSeatId("selected");
    setError("");
    setNotice("");

    try {
      const { data } = await apiClient.post(
        `/shows/${showId}/holds`,
        {
          seatIds: selectedSeats.map(
            (seat) => seat.id,
          ),
        },
      );

      setHold(data.hold);

      expirationHandled.current = "";

      window.localStorage.setItem(
        holdStorageKey(showId),
        data.hold.id,
      );

      /*
       * Immediately reflect successful holds visually.
       */
      const heldSeatIds =
        data.hold.seatIds ||
        [data.hold.seatId];

      setSeats((current) =>
        current.map((item) =>
          heldSeatIds.includes(item.id)
            ? {
                ...item,
                status: "HELD",
              }
            : item,
        ),
      );

      setSelectedSeats([]);
    } catch (holdError) {
      /*
       * 409 means another buyer won the race.
       */
      if (holdError.response?.status === 409) {
        setNotice(
          selectedSeats.length === 1
            ? "Someone else just took that seat. Pick another available seat."
            : "One or more selected seats are no longer available. Please choose again.",
        );

        setSelectedSeats([]);

        await loadSeatMap({
          silent: true,
        });
      } else {
        setError(
          apiErrorMessage(
            holdError,
            "The seats could not be held.",
          ),
        );
      }
    } finally {
      holdRequestInFlight.current = false;
      setHoldingSeatId("");
    }
  }

  /*
   * ---------------------------------------------------------
   * MANUAL SEAT REFRESH
   * ---------------------------------------------------------
   */
  async function handleManualRefresh() {
    if (refreshing) return;

    setNotice("");

    await loadSeatMap({
      silent: true,
    });
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT START CALLBACK
   * ---------------------------------------------------------
   */
  function paymentStarted(nextPayment) {
    setPayment(nextPayment);
    setPaymentPollError("");

    window.localStorage.setItem(
      paymentStorageKey(showId),
      nextPayment.id,
    );
  }

  /*
   * ---------------------------------------------------------
   * COMPUTED VALUES
   * ---------------------------------------------------------
   */
  const checkoutVisible = Boolean(
    hold || payment,
  );

  const seatInteractionLocked =
    Boolean(holdingSeatId) ||
    hold?.status === "ACTIVE" ||
    payment?.status === "PENDING";

  const selectedTotal = selectedSeats.reduce(
    (total, seat) =>
      total + Number(seat.price || 0),
    0,
  );

  const seatRows = seats.reduce((rows, seat) => {
    const rowName = seat.row || String(seat.label).match(/^[A-Za-z]+/)?.[0] || "Seats";
    const existingRow = rows.find((row) => row.name === rowName);

    if (existingRow) {
      existingRow.seats.push(seat);
    } else {
      rows.push({ name: rowName, seats: [seat] });
    }

    return rows;
  }, []).map((row) => ({
    ...row,
    seats: [...row.seats].sort((first, second) => {
      const firstColumn = first.column ?? Number(String(first.label).match(/\d+$/)?.[0] || 0);
      const secondColumn = second.column ?? Number(String(second.label).match(/\d+$/)?.[0] || 0);
      return firstColumn - secondColumn;
    }),
  })).sort((first, second) => first.name.localeCompare(second.name));

  const seatTiers = seats.reduce((tiers, seat) => {
    const tierName = seat.tier || "Standard";
    const existingTier = tiers.find((tier) => tier.name === tierName);

    if (existingTier) {
      existingTier.total += 1;
      if (seat.status === "AVAILABLE") existingTier.available += 1;
    } else {
      tiers.push({
        name: tierName,
        price: seat.price,
        total: 1,
        available: seat.status === "AVAILABLE" ? 1 : 0,
      });
    }
    return tiers;
  }, []).sort((first, second) =>
    ["Standard", "Classic", "Premium", "VIP"].indexOf(first.name) -
    ["Standard", "Classic", "Premium", "VIP"].indexOf(second.name),
  );

  const effectiveActiveTier = activeTier === "ALL" || seatTiers.some((tier) => tier.name === activeTier)
    ? activeTier
    : "ALL";

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10">

      {/* PAGE HEADER */}
      <div className="premium-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <Link
          to={
            show?.movie?.id
              ? `/movie/${show.movie.id}`
              : "/"
          }
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            text-zinc-500
            transition
            hover:text-zinc-300
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-white
          "
        >
          ← Back to showtimes
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>
            <p className="text-sm uppercase tracking-widest text-zinc-500">
              {show?.movie?.title ||
                `Show #${showId}`}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Choose your seat
            </h1>

            <p className="mt-3 text-sm text-zinc-400 sm:text-base">
              Select up to four seats from the live auditorium below.
            </p>
          </div>

          {/* LIVE / REFRESH CONTROL */}
          {!checkoutVisible && (
            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <div className="flex items-center justify-end gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                  </span>

                  <span className="text-xs font-medium text-zinc-400">
                    Live seat map
                  </span>
                </div>

                {lastUpdated && (
                  <p className="mt-1 text-xs text-zinc-600">
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      },
                    )}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={
                  refreshing ||
                  loading ||
                  seatInteractionLocked
                }
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-5
                  py-3
                  text-sm
                  font-medium
                  text-zinc-300
                  transition
                  hover:border-violet-400/30
                  hover:bg-violet-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white
                "
              >
                {refreshing
                  ? "Refreshing…"
                  : "↻ Refresh"}
              </button>

            </div>
          )}

        </div>

        {show && (
          <dl className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Date", show.date || "Today"],
              ["Show time", show.time || "—"],
              ["Cinema hall", show.theatre || show.hall || "—"],
              ["Booking limit", "Up to 4 seats"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.035] px-5 py-4">
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">{label}</dt>
                <dd className="mt-2 text-lg font-bold text-zinc-100">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* MOBILE LAST UPDATED */}
        {!checkoutVisible &&
          lastUpdated && (
            <div className="mt-4 flex items-center gap-2 sm:hidden">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>

              <p className="text-xs text-zinc-500">
                Live · Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  },
                )}
              </p>
            </div>
          )}
      </div>


      {/* ERROR */}
      {error && (
        <div className="mt-6">
          <InlineNotice>
            {error}
          </InlineNotice>
        </div>
      )}


      {/* NOTICE */}
      {notice && (
        <div className="mt-6">
          <InlineNotice tone="warning">
            {notice}
          </InlineNotice>
        </div>
      )}


      {/* PRICE TIER FILTER */}
      {!loading && seatTiers.length > 0 && (
        <section className="mt-8" aria-label="Seat price sections">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Choose a section</p>
              <h2 className="mt-1 text-2xl font-black">Seat class & price</h2>
            </div>
            <p className="text-sm text-zinc-500">Filter the auditorium without losing selected seats.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => setActiveTier("ALL")}
              aria-pressed={effectiveActiveTier === "ALL"}
              aria-controls="seat-map"
              className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${effectiveActiveTier === "ALL" ? "border-violet-400 bg-violet-500/15 shadow-[0_12px_35px_rgba(91,33,182,0.2)]" : "border-white/10 bg-white/[0.035] hover:border-white/20"}`}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">All sections</span>
              <span className="mt-2 block text-xl font-black">{seats.filter((seat) => seat.status === "AVAILABLE").length} available</span>
            </button>

            {seatTiers.map((tier) => (
              <button
                key={tier.name}
                type="button"
                onClick={() => setActiveTier(tier.name)}
                aria-pressed={effectiveActiveTier === tier.name}
                aria-controls="seat-map"
                className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${effectiveActiveTier === tier.name ? "border-violet-400 bg-violet-500/15 shadow-[0_12px_35px_rgba(91,33,182,0.2)]" : "border-white/10 bg-white/[0.035] hover:border-white/20"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-black">{tier.name}</span>
                  <span className="font-black text-violet-300">৳{tier.price}</span>
                </span>
                <span className="mt-2 block text-xs text-zinc-500">{tier.available} of {tier.total} available</span>
              </button>
            ))}
          </div>
        </section>
      )}


      {/* SEAT MAP */}
      <section
        id="seat-map"
        className="premium-panel mt-8 rounded-[2.5rem] px-4 py-12 sm:px-8 sm:py-16"
        aria-busy={loading || refreshing}
      >

        {/* SCREEN */}
        <div className="mx-auto max-w-3xl">

          <div
            className="
              h-3
              rounded-full
              bg-gradient-to-r
              from-transparent
              via-violet-300
              to-transparent
              shadow-[0_12px_45px_rgba(139,92,246,0.45)]
            "
          />

          <p className="mt-3 text-center text-xs uppercase tracking-[0.35em] text-zinc-500">
            Screen
          </p>

        </div>


        {/* LOADING */}
        {loading ? (

          <div className="mx-auto mt-12 h-56 max-w-xl animate-pulse rounded-2xl bg-zinc-900" />

        ) : (

          /*
           * Horizontal scrolling keeps seats large and easy
           * to tap on narrow mobile screens.
           */
          <div className="mt-10 overscroll-x-contain overflow-x-auto pb-3 sm:mt-12">

            <div className="mx-auto min-w-[790px] max-w-4xl space-y-3">

              {seatRows.map((row) => (
                <div key={row.name} className="grid grid-cols-[2rem_1fr_5rem] items-center gap-3">
                  <span className="text-center text-xs font-black text-zinc-600">{row.name}</span>

                  <div className="flex items-center justify-center gap-2.5">
                    {row.seats.map((seat) => {
                      const seatColumn = seat.column ?? Number(String(seat.label).match(/\d+$/)?.[0] || 0);
                      const isSelected = selectedSeats.some((item) => item.id === seat.id);
                      const isOwned = Boolean(
                        hold?.status === "ACTIVE" &&
                          (hold.seatIds?.includes(seat.id) || hold.seatId === seat.id),
                      );
                      const matchesTier = effectiveActiveTier === "ALL" ||
                        (seat.tier || "Standard") === effectiveActiveTier;

                      return (
                      <div key={seat.id} className={`${seatColumn === 6 ? "ml-7" : ""} ${!matchesTier && !isSelected && !isOwned ? "opacity-20" : ""}`}>
                        <Seat
                          seat={seat}

                          isOwned={isOwned}

                          isSelected={isSelected}

                          disabled={
                            seatInteractionLocked ||
                            (
                              selectedSeats.length >= 4 &&
                              !isSelected
                            ) ||
                            (!matchesTier && !isSelected && !isOwned)
                          }

                          onSelect={toggleSeat}
                        />
                      </div>
                      );
                    })}
                  </div>

                  <span className="text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600">{row.seats[0]?.tier || "Standard"}</span>
                </div>
              ))}

            </div>

          </div>

        )}

        {!loading && (
          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-700" aria-live="polite">
            {effectiveActiveTier === "ALL" ? "Showing every section" : `Focusing ${effectiveActiveTier} seats`} · Swipe sideways on smaller screens
          </p>
        )}

      </section>

      {/* LEGEND */}
      <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm sm:mt-10">

        {[
          ["bg-zinc-800", "Available"],
          ["bg-white", "Selected / yours"],
          [
            "bg-yellow-500/30",
            "Held",
          ],
          [
            "bg-red-500/30",
            "Booked",
          ],
        ].map(([color, label]) => (

          <div
            key={label}
            className="flex items-center gap-2"
          >

            <div
              className={`h-4 w-4 rounded ${color}`}
            />

            <span className="text-zinc-400">
              {label}
            </span>

          </div>

        ))}

      </div>


      {/* NO SEATS SELECTED */}
      {!checkoutVisible &&
        !loading &&
        selectedSeats.length === 0 && (

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.035] p-7 text-center">

            <p className="text-zinc-400">
              Select between one and four
              available seats.
            </p>

            <p className="mt-2 text-xs text-zinc-600">
              Seat availability updates
              automatically every 5 seconds.
            </p>

          </div>

        )}


      {/* SELECTED SEATS SUMMARY */}
      {!checkoutVisible &&
        selectedSeats.length > 0 && (

          <div className="premium-panel mx-auto mt-10 max-w-2xl rounded-[2rem] p-6 sm:p-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-zinc-400">
                  {selectedSeats.length} of 4{" "}
                  {selectedSeats.length === 1
                    ? "seat"
                    : "seats"}{" "}
                  selected
                </p>

                <p className="mt-2 text-2xl font-black text-violet-200">
                  {selectedSeats
                    .map(
                      (seat) =>
                        seat.label,
                    )
                    .join(", ")}
                </p>

                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {[...new Set(selectedSeats.map((seat) => seat.tier || "Standard"))].join(" + ")}
                </p>

              </div>


              <div className="text-right">

                <p className="text-xs text-zinc-500">
                  Total
                </p>

                <p className="mt-1 text-3xl font-black">
                  ৳{selectedTotal}
                </p>

              </div>

            </div>


            {/* INDIVIDUAL PRICES */}
            {selectedSeats.length > 1 && (

              <div className="mt-5 space-y-2 border-t border-zinc-800 pt-4">

                {selectedSeats.map(
                  (seat) => (

                    <div
                      key={seat.id}
                      className="flex justify-between text-sm"
                    >

                      <span className="text-zinc-400">
                        Seat {seat.label} · {seat.tier || "Standard"}
                      </span>

                      <span className="text-zinc-300">
                        ৳{seat.price}
                      </span>

                    </div>

                  ),
                )}

              </div>

            )}


            <button
              type="button"
              onClick={holdSelectedSeats}
              disabled={Boolean(
                holdingSeatId,
              )}
              className="
                mt-5
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-violet-500
                to-fuchsia-500
                px-4
                py-4
                font-bold
                text-white
                transition
                hover:brightness-110
                hover:shadow-[0_15px_45px_rgba(139,92,246,0.25)]
                disabled:cursor-not-allowed
                disabled:opacity-50
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-offset-2
                focus-visible:ring-offset-zinc-900
              "
            >
              {holdingSeatId
                ? "Holding seats…"
                : `Hold ${selectedSeats.length} ${
                    selectedSeats.length ===
                    1
                      ? "seat"
                      : "seats"
                  }`}
            </button>

            <p className="mt-3 text-center text-xs text-zinc-600">
              Seats are not guaranteed until
              the hold succeeds.
            </p>

          </div>

        )}


      {/* CHECKOUT / PAYMENT */}
      {checkoutVisible && (

        <div className="mx-auto mt-10 max-w-2xl">

          <BookingPanel
            hold={
              hold || {
                status: "COMPLETED",
                seatLabel:
                  payment?.seatLabel,
                seatLabels:
                  payment?.seatLabels,
                price:
                  payment?.amount,
              }
            }

            countdown={countdown}

            payment={payment}

            paymentPollError={
              paymentPollError
            }

            onPaymentStarted={
              paymentStarted
            }

            show={show}
          />

        </div>

      )}

    </main>
  );
}

export default SeatSelectionPage;
