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
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

      {/* Poster placeholder */}
      <div className="aspect-[2/3] animate-pulse bg-zinc-800" />

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

    loadMovies()

  }, [loadMovies])


  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">


      {/* =====================================================
          HERO SECTION
          ===================================================== */}

      <section
        className="
          relative
          mb-14
          overflow-hidden
          rounded-3xl
          border
          border-zinc-800
          bg-zinc-900
        "
      >

        <div className="grid min-h-[420px] md:grid-cols-2">


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
              md:p-12
              lg:p-14
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
                border-zinc-700
                bg-zinc-950/60
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
                    bg-green-400
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
                    bg-green-400
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
              CinemaSeat
            </p>


            <h1
              className="
                mt-4
                max-w-xl
                text-4xl
                font-bold
                tracking-tight
                sm:text-5xl
                lg:text-6xl
              "
            >
              Your seat.
              <br />

              <span className="text-zinc-400">
                Before someone else gets it.
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
                  rounded-lg
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-black
                  transition
                  hover:bg-zinc-200
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-zinc-900
                "
              >
                Browse movies
              </a>


              <div className="text-sm text-zinc-500">
                Live seat availability
              </div>

            </div>

          </div>


          {/* HERO IMAGE */}

          <div className="relative min-h-[300px] md:min-h-full">

            <img
              src={heroImage}
              alt="Cinema experience"
              className="absolute inset-0 h-full w-full object-cover"
            />


            {/* Desktop image gradient */}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-zinc-900
                via-transparent
                to-transparent
                md:bg-gradient-to-r
                md:from-zinc-900
                md:via-zinc-900/20
                md:to-transparent
              "
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          NOW SHOWING HEADER
          ===================================================== */}

      <section id="now-showing">

        <div
          className="
            mb-8
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
                font-bold
                tracking-tight
                sm:text-4xl
              "
            >
              Pick a movie
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
          "
          aria-busy={loading}
        >

          {loading
            ? Array.from(
                { length: 6 },
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
          mt-20
          grid
          gap-px
          overflow-hidden
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-800
          sm:grid-cols-3
        "
      >

        <div className="bg-zinc-950 p-6">

          <p className="font-semibold">
            Live availability
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Seat availability stays updated while you browse.
          </p>

        </div>


        <div className="bg-zinc-950 p-6">

          <p className="font-semibold">
            Temporary seat holds
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Selected seats are protected while you complete
            checkout.
          </p>

        </div>


        <div className="bg-zinc-950 p-6">

          <p className="font-semibold">
            Clear booking status
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