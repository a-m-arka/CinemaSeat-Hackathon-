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

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">

      {/* PAGE HEADER */}
      <div>
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

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Choose your seat
            </h1>

            <p className="mt-3 text-sm text-zinc-400 sm:text-base">
              {show
                ? `${show.time} · ${show.theatre} · Select up to 4 seats`
                : "Select up to four available seats."}
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
                  rounded-lg
                  border
                  border-zinc-700
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-zinc-300
                  transition
                  hover:border-zinc-500
                  hover:bg-zinc-900
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


      {/* SEAT MAP */}
      <section
        className="mt-10 sm:mt-12"
        aria-busy={loading || refreshing}
      >

        {/* SCREEN */}
        <div className="mx-auto max-w-2xl">

          <div
            className="
              h-2
              rounded-full
              bg-gradient-to-r
              from-zinc-800
              via-zinc-400
              to-zinc-800
              shadow-[0_12px_35px_rgba(255,255,255,0.15)]
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
          <div className="mt-10 overflow-x-auto pb-3 sm:mt-12">

            <div className="mx-auto min-w-[420px] max-w-xl">

              <div className="grid grid-cols-6 place-items-center gap-2 sm:gap-3">

                {seats.map((seat) => (

                  <Seat
                    key={seat.id}
                    seat={seat}

                    isOwned={Boolean(
                      hold?.status === "ACTIVE" &&
                        (
                          hold.seatIds?.includes(
                            seat.id,
                          ) ||
                          hold.seatId ===
                            seat.id
                        ),
                    )}

                    isSelected={selectedSeats.some(
                      (item) =>
                        item.id === seat.id,
                    )}

                    disabled={
                      seatInteractionLocked ||
                      (
                        selectedSeats.length >=
                          4 &&
                        !selectedSeats.some(
                          (item) =>
                            item.id ===
                            seat.id,
                        )
                      )
                    }

                    onSelect={toggleSeat}
                  />

                ))}

              </div>

            </div>

          </div>

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

          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">

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

          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-zinc-400">
                  {selectedSeats.length} of 4{" "}
                  {selectedSeats.length === 1
                    ? "seat"
                    : "seats"}{" "}
                  selected
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {selectedSeats
                    .map(
                      (seat) =>
                        seat.label,
                    )
                    .join(", ")}
                </p>

              </div>


              <div className="text-right">

                <p className="text-xs text-zinc-500">
                  Total
                </p>

                <p className="mt-1 text-2xl font-semibold">
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
                        Seat {seat.label}
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
                rounded-lg
                bg-white
                px-4
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

        <div className="mx-auto mt-10 max-w-xl">

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
          />

        </div>

      )}

    </main>
  );
}

export default SeatSelectionPage;