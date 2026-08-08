import { Link } from "react-router-dom"

function MovieCard({ movie }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">

      <div className="aspect-[2/3] bg-zinc-800">
        <img
          src={movie.poster}
          alt={movie.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-4">

        <h2 className="text-lg font-semibold">
          {movie.title}
        </h2>

        <p className="mt-1 text-sm text-zinc-400">
          {movie.genre}
        </p>

        <Link
          to={`/movie/${movie.id}`}
          className="mt-4 block w-full rounded-lg bg-white px-4 py-2 text-center font-medium text-black hover:bg-zinc-200"
        >
          View Showtimes
        </Link>

      </div>

    </div>
  )
}

export default MovieCard