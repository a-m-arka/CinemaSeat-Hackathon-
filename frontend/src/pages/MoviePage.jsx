import { Link, useParams } from "react-router-dom"

function MoviePage() {

  const { movieId } = useParams()

  const showtimes = [
    {
      id: 101,
      time: "10:30 AM",
      theatre: "Hall 1"
    },
    {
      id: 102,
      time: "3:00 PM",
      theatre: "Hall 1"
    },
    {
      id: 103,
      time: "8:00 PM",
      theatre: "Hall 2"
    },
    {
      id: 104,
      time: "11:59 PM",
      theatre: "Hall 2"
    }
  ]

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      <p className="text-sm uppercase tracking-widest text-zinc-500">
        Movie #{movieId}
      </p>

      <h1 className="mt-2 text-4xl font-bold">
        Spider-Man: Brand New Day
      </h1>

      <p className="mt-3 text-zinc-400">
        Select a showtime to continue to seat selection.
      </p>


      <div className="mt-10">

        <h2 className="text-xl font-semibold">
          Today's Showtimes
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {showtimes.map((show) => (

            <Link
              key={show.id}
              to={`/show/${show.id}/seats`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600"
            >

              <p className="text-xl font-semibold">
                {show.time}
              </p>

              <p className="mt-1 text-sm text-zinc-400">
                {show.theatre}
              </p>

            </Link>

          ))}

        </div>

      </div>

    </main>
  )
}

export default MoviePage