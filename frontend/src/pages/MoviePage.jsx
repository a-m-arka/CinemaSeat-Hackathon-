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
      <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10">

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

  const showtimeGroups = showtimes.reduce((groups, show) => {
    const hallName = show.theatre || show.hall || "Cinema Hall"
    const existingGroup = groups.find((group) => group.hall === hallName)

    if (existingGroup) existingGroup.shows.push(show)
    else groups.push({ hall: hallName, shows: [show] })

    return groups
  }, [])


  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10">

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
      <section className="premium-panel relative mt-8 overflow-hidden rounded-[2.5rem] p-6 sm:p-10 lg:p-14">

        {movie?.poster && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]">
            <img src={movie.poster} alt="" className="h-full w-full scale-125 object-cover blur-3xl" />
          </div>
        )}

        <div className="relative grid gap-10 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] lg:gap-16">


          {/* MOVIE POSTER */}
          <div>

            {movie?.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="
                  aspect-[2/3]
                  w-full
                  rounded-[2rem]
                  border
                  border-zinc-800
                  object-cover
                  shadow-[0_35px_80px_rgba(0,0,0,0.5)]
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
                  text-5xl
                  font-black
                tracking-tight
                  sm:text-6xl
                  lg:text-7xl
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
                    border-violet-400/20
                    bg-violet-500/10
                    px-4
                    py-2
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
                    border-violet-400/20
                    bg-violet-500/10
                    px-4
                    py-2
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
      <section className="mt-20 border-t border-white/10 pt-12">

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

            <h2 className="mt-2 text-3xl font-black sm:text-5xl">
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

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {showtimeGroups.map((group, groupIndex) => (
              <section key={group.hall} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 font-black text-violet-300">{String(groupIndex + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">Cinema hall</p>
                      <h3 className="mt-1 text-xl font-black">{group.hall}</h3>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live</span>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                  {group.shows.map((show) => (
                    <Link
                      key={show.id}
                      to={`/show/${show.id}/seats`}
                      className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Show time</p>
                          <p className="mt-2 text-3xl font-black tracking-tight">{show.time}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-500 transition group-hover:bg-violet-500 group-hover:text-white">→</span>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                        <span className="text-zinc-500">{show.date || "Today"}</span>
                        <span className="font-semibold text-violet-300">Choose seats</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
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
