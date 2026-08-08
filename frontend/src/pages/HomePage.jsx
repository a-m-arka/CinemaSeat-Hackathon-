import { useCallback, useEffect, useState } from "react"

import apiClient, { apiErrorMessage } from "../api/client"
import InlineNotice from "../components/InlineNotice"
import MovieCard from "../components/MovieCard"
import heroImage from "../assets/hero.png"


/*
 * ---------------------------------------------------------
 * MOVIE CARD LOADING SKELETON
 * ---------------------------------------------------------
 *
 * Displayed while movie data is loading.
 * This prevents the page from looking empty.
 */
function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-900">

      {/* Poster placeholder */}
      <div className="aspect-[5/6] animate-pulse bg-zinc-800" />

      <div className="space-y-3 p-5">

        {/* Movie title placeholder */}
        <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-800" />

        {/* Genre placeholder */}
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />

        {/* Button placeholder */}
        <div className="mt-5 h-10 w-full animate-pulse rounded-lg bg-zinc-800" />

      </div>

    </div>
  )
}


function HomePage() {

  /*
   * ---------------------------------------------------------
   * STATE
   * ---------------------------------------------------------
   */

  const [movies, setMovies] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")


  /*
   * ---------------------------------------------------------
   * LOAD MOVIES
   * ---------------------------------------------------------
   *
   * Used both:
   *
   * 1. When the homepage first opens
   * 2. When the user presses "Try again"
   */
  const loadMovies = useCallback(async () => {

    setLoading(true)
    setError("")

    try {

      const { data } = await apiClient.get("/movies")

      /*
       * Supports either backend response:
       *
       * {
       *   movies: [...]
       * }
       *
       * OR simply:
       *
       * [...]
       */
      setMovies(data.movies || data || [])

    } catch (loadError) {

      setError(
        apiErrorMessage(
          loadError,
          "Movies could not be loaded.",
        ),
      )

    } finally {

      setLoading(false)

    }

  }, [])


  /*
   * ---------------------------------------------------------
   * INITIAL PAGE LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let active = true

    async function loadInitialMovies() {
      try {
        const { data } = await apiClient.get("/movies")
        if (active) setMovies(data.movies || data || [])
      } catch (loadError) {
        if (active) {
          setError(apiErrorMessage(loadError, "Movies could not be loaded."))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialMovies()

    return () => {
      active = false
    }
  }, [])


  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12 lg:px-10">


      {/* =====================================================
          HERO SECTION
          ===================================================== */}

      <section
        className="
          relative
          premium-panel
          mb-16
          overflow-hidden
          rounded-[2.5rem]
        "
      >

        <div className="grid min-h-[500px] lg:grid-cols-[1.12fr_0.88fr]">


          {/* HERO TEXT */}

          <div
            className="
              relative
              z-10
              flex
              flex-col
              justify-center
              p-7
              sm:p-10
              lg:p-12
              xl:p-14
            "
          >

            <div
              className="
                mb-5
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-violet-400/20
                bg-violet-500/10
                px-3
                py-1.5
              "
            >

              <span className="relative flex h-2 w-2">

                <span
                  className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    animate-ping
                    rounded-full
                    bg-emerald-400
                    opacity-50
                  "
                />

                <span
                  className="
                    relative
                    inline-flex
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-400
                  "
                />

              </span>

              <span className="text-xs font-medium uppercase tracking-wider text-zinc-300">
                Booking now open
              </span>

            </div>


            <p
              className="
                text-sm
                font-medium
                uppercase
                tracking-[0.28em]
                text-zinc-500
              "
            >
              Your next movie night
            </p>


            <h1
              className="
                mt-4
                max-w-3xl
                text-4xl
                font-black
                tracking-tight
                sm:text-5xl
                lg:text-6xl
                xl:text-7xl
              "
            >
              Big screen.
              <br />

              <span className="gradient-text">
                Your perfect seat.
              </span>

            </h1>


            <p
              className="
                mt-6
                max-w-lg
                text-base
                leading-7
                text-zinc-400
                sm:text-lg
              "
            >
              Find a movie, choose your showtime and secure
              your favourite seats before the countdown ends.
            </p>


            <div className="mt-8 flex flex-wrap items-center gap-4">

              <a
                href="#now-showing"
                className="
                  rounded-2xl
                  bg-gradient-to-r
                  from-violet-500
                  to-fuchsia-500
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:brightness-110
                  hover:shadow-[0_15px_45px_rgba(139,92,246,0.3)]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-zinc-900
                "
              >
                Explore movies →
              </a>


              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">✓</span>
                No account required
              </div>

            </div>

          </div>


          {/* HERO IMAGE */}

          <div className="relative min-h-[320px] overflow-hidden lg:min-h-full">

            <div className="absolute inset-10 rounded-full bg-violet-600/20 blur-[90px]" />

            <img
              src={heroImage}
              alt="Cinema experience"
              className="absolute inset-0 h-full w-full object-contain p-14 drop-shadow-[0_35px_70px_rgba(124,58,237,0.4)] sm:p-20 lg:p-16 xl:p-20"
            />


            {/* Desktop image gradient */}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-[#111118]
                via-transparent
                to-transparent
                lg:bg-gradient-to-r
                lg:from-[#111118]
                lg:via-[#111118]/20
                lg:to-transparent
              "
            />

            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl sm:bottom-10 sm:left-10 sm:right-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Booking experience</p>
                <p className="mt-1 font-bold">Fast. Live. Stress-free.</p>
              </div>
              <div className="flex -space-x-2">
                {["A1", "A2", "A3"].map((seat) => <span key={seat} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#111118] bg-violet-500 text-[10px] font-bold">{seat}</span>)}
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          NOW SHOWING HEADER
          ===================================================== */}

      <section id="now-showing">

        <div
          className="
            mb-10
            flex
            flex-col
            justify-between
            gap-4
            sm:flex-row
            sm:items-end
          "
        >

          <div>

            <p
              className="
                text-sm
                font-medium
                uppercase
                tracking-[0.25em]
                text-zinc-500
              "
            >
              Now Showing
            </p>


            <h2
              className="
                mt-2
                text-3xl
                font-black
                tracking-tight
                sm:text-4xl
              "
            >
              What are we watching?
            </h2>


            <p className="mt-3 max-w-2xl text-zinc-400">
              Choose your showtime and reserve your seat
              before someone else does.
            </p>

          </div>


          {!loading && !error && movies.length > 0 && (

            <p className="text-sm text-zinc-500">

              {movies.length}{" "}
              {movies.length === 1
                ? "movie"
                : "movies"}{" "}
              showing

            </p>

          )}

        </div>


        {/* =====================================================
            ERROR
            ===================================================== */}

        {error && (

          <div className="mb-8 space-y-4">

            <InlineNotice>
              {error}
            </InlineNotice>


            <button
              type="button"
              onClick={loadMovies}
              disabled={loading}
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
              {loading
                ? "Loading…"
                : "Try again"}
            </button>

          </div>

        )}


        {/* =====================================================
            MOVIE GRID
            ===================================================== */}

        <div
          className="
            grid
            gap-6
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
          aria-busy={loading}
        >

          {loading
            ? Array.from(
                { length: 3 },
                (_, index) => (
                  <MovieCardSkeleton
                    key={index}
                  />
                ),
              )

            : movies.map((movie) => (

                <MovieCard
                  key={movie.id}
                  movie={movie}
                />

              ))}

        </div>


        {/* =====================================================
            EMPTY STATE
            ===================================================== */}

        {!loading &&
          !error &&
          movies.length === 0 && (

            <div
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-900
                px-6
                py-16
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-zinc-800
                  text-2xl
                "
              >
                🎬
              </div>


              <h3 className="mt-5 text-xl font-semibold">
                No movies showing
              </h3>


              <p className="mt-2 text-zinc-500">
                There are no available movies right now.
                Check again later.
              </p>

            </div>

          )}

      </section>


      {/* =====================================================
          SMALL FEATURE STRIP
          ===================================================== */}

      <section
        className="
          mt-24
          grid
          gap-px
          overflow-hidden
          rounded-[2rem]
          border
          border-white/10
          bg-white/10
          sm:grid-cols-3
        "
      >

        <div className="bg-[#0d0d14] p-8">

          <p className="text-lg font-bold">
            <span className="mr-3 text-violet-400">01</span> Live availability
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Seat availability stays updated while you browse.
          </p>

        </div>


        <div className="bg-[#0d0d14] p-8">

          <p className="text-lg font-bold">
            <span className="mr-3 text-fuchsia-400">02</span> Temporary seat holds
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Selected seats are protected while you complete
            checkout.
          </p>

        </div>


        <div className="bg-[#0d0d14] p-8">

          <p className="text-lg font-bold">
            <span className="mr-3 text-rose-400">03</span> Clear booking status
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Follow your booking from seat selection through
            payment confirmation.
          </p>

        </div>

      </section>

    </main>
  )
}

export default HomePage
