import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import apiClient, { apiErrorMessage } from "../api/client"
import InlineNotice from "../components/InlineNotice"


function MoviePage() {
  const { movieId } = useParams()

  const [movie, setMovie] = useState(null)
  const [showtimes, setShowtimes] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")


  /*
   * ---------------------------------------------------------
   * LOAD MOVIE DETAILS
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let active = true

    async function loadMovie() {
      setLoading(true)
      setError("")

      try {
        const { data } = await apiClient.get(
          `/movies/${movieId}`,
        )

        if (!active) return

        const nextMovie = data.movie || data

        setMovie(nextMovie)

        setShowtimes(
          data.showtimes ||
          nextMovie?.showtimes ||
          [],
        )
      } catch (loadError) {
        if (!active) return

        setError(
          apiErrorMessage(
            loadError,
            "Movie details could not be loaded.",
          ),
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMovie()

    return () => {
      active = false
    }
  }, [movieId])


  /*
   * ---------------------------------------------------------
   * LOADING STATE
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="animate-pulse">

          <div className="h-4 w-32 rounded bg-zinc-800" />

          <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">

            <div className="aspect-[2/3] rounded-2xl bg-zinc-900" />

            <div className="space-y-4">

              <div className="h-4 w-32 rounded bg-zinc-800" />

              <div className="h-10 w-3/4 rounded bg-zinc-800" />

              <div className="h-5 w-48 rounded bg-zinc-800" />

              <div className="mt-8 h-20 max-w-xl rounded bg-zinc-900" />

            </div>

          </div>

        </div>

      </main>
    )
  }


  /*
   * ---------------------------------------------------------
   * ERROR STATE
   * ---------------------------------------------------------
   */
  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">

        <Link
          to="/"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← Back to movies
        </Link>

        <div className="mt-8">
          <InlineNotice>
            {error}
          </InlineNotice>
        </div>

      </main>
    )
  }


  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

      {/* BACK LINK */}
      <Link
        to="/"
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
        ← Back to movies
      </Link>


      {/* =====================================================
          MOVIE HERO
          ===================================================== */}
      <section className="mt-8">

        <div className="grid gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">


          {/* MOVIE POSTER */}
          <div>

            {movie?.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="
                  aspect-[2/3]
                  w-full
                  rounded-2xl
                  border
                  border-zinc-800
                  object-cover
                  shadow-2xl
                "
              />
            ) : (
              <div
                className="
                  flex
                  aspect-[2/3]
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900
                  text-zinc-600
                "
              >
                No poster
              </div>
            )}

          </div>


          {/* MOVIE DETAILS */}
          <div className="flex flex-col justify-center">

            <p
              className="
                text-sm
                font-medium
                uppercase
                tracking-[0.24em]
                text-zinc-500
              "
            >
              {movie?.genre || `Movie #${movieId}`}
            </p>


            <h1
              className="
                mt-3
                max-w-3xl
                text-4xl
                font-bold
                tracking-tight
                sm:text-5xl
                lg:text-6xl
              "
            >
              {movie?.title || "Untitled movie"}
            </h1>


            {/* MOVIE META */}
            <div className="mt-5 flex flex-wrap items-center gap-3">

              {movie?.duration && (
                <span
                  className="
                    rounded-full
                    border
                    border-zinc-700
                    bg-zinc-900
                    px-3
                    py-1.5
                    text-sm
                    text-zinc-300
                  "
                >
                  {movie.duration}
                </span>
              )}

              {movie?.rating && (
                <span
                  className="
                    rounded-full
                    border
                    border-zinc-700
                    bg-zinc-900
                    px-3
                    py-1.5
                    text-sm
                    text-zinc-300
                  "
                >
                  {movie.rating}
                </span>
              )}

            </div>


            {/* DESCRIPTION */}
            <p
              className="
                mt-7
                max-w-2xl
                text-base
                leading-7
                text-zinc-400
              "
            >
              {movie?.description ||
                "Choose a showtime below to continue to seat selection."}
            </p>


            {/* SMALL INFO */}
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-zinc-500">

              <div>
                <p className="text-zinc-600">
                  Booking
                </p>

                <p className="mt-1 text-zinc-300">
                  Live seat availability
                </p>
              </div>

              <div>
                <p className="text-zinc-600">
                  Seat hold
                </p>

                <p className="mt-1 text-zinc-300">
                  Limited-time reservation
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SHOWTIMES
          ===================================================== */}
      <section className="mt-14 border-t border-zinc-800 pt-10">

        <div
          className="
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
                tracking-[0.24em]
                text-zinc-500
              "
            >
              Available today
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Choose a showtime
            </h2>

            <p className="mt-2 text-zinc-400">
              Select a time to view live seat availability.
            </p>

          </div>


          {showtimes.length > 0 && (
            <p className="text-sm text-zinc-500">
              {showtimes.length}{" "}
              {showtimes.length === 1
                ? "show"
                : "shows"}{" "}
              available
            </p>
          )}

        </div>


        {/* SHOWTIME CARDS */}
        {showtimes.length > 0 ? (

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {showtimes.map((show) => (

              <Link
                key={show.id}
                to={`/show/${show.id}/seats`}
                className="
                  group
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-900
                  p-5
                  transition
                  hover:-translate-y-1
                  hover:border-zinc-600
                  hover:bg-zinc-800/80
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-white
                "
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p
                      className="
                        text-2xl
                        font-semibold
                        tracking-tight
                      "
                    >
                      {show.time}
                    </p>


                    <p className="mt-2 text-sm text-zinc-400">
                      {show.theatre || "Cinema Hall"}
                    </p>


                    {show.date && (
                      <p className="mt-1 text-xs text-zinc-600">
                        {show.date}
                      </p>
                    )}

                  </div>


                  <span
                    className="
                      text-zinc-600
                      transition
                      group-hover:translate-x-1
                      group-hover:text-white
                    "
                  >
                    →
                  </span>

                </div>


                <div className="mt-5 border-t border-zinc-800 pt-4">

                  <p className="text-xs text-zinc-500">
                    View seats
                  </p>

                </div>

              </Link>

            ))}

          </div>

        ) : (

          /*
           * -------------------------------------------------
           * EMPTY SHOWTIME STATE
           * -------------------------------------------------
           */
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900
              px-6
              py-12
              text-center
            "
          >

            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-zinc-800
                text-xl
              "
            >
              🎟️
            </div>


            <h3 className="mt-4 text-lg font-semibold">
              No showtimes today
            </h3>


            <p className="mt-2 text-sm text-zinc-500">
              There are currently no available showtimes for this movie.
            </p>

          </div>

        )}

      </section>

    </main>
  )
}

export default MoviePage