import { Link } from "react-router-dom"

function MovieCard({ movie }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111118] shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition duration-500 hover:-translate-y-1.5 hover:border-violet-400/30 hover:shadow-[0_25px_70px_rgba(91,33,182,0.16)]">
      <div className="relative aspect-[5/6] overflow-hidden bg-zinc-900">
        <img
          src={movie.poster}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-transparent to-black/20" />

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" />
          Now showing
        </div>

        {movie.rating && (
          <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-bold backdrop-blur-xl">
            {movie.rating}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">{movie.genre}</p>
        </div>
      </div>

      <div className="relative p-5">
        <div className="absolute -top-px left-6 h-px w-20 bg-gradient-to-r from-violet-400 to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.03em]">{movie.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{movie.duration || "Now playing"} {movie.rating ? `· ${movie.rating}` : ""}</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-zinc-400 transition group-hover:border-violet-400/30 group-hover:bg-violet-500 group-hover:text-white">↗</span>
        </div>

        <Link
          to={`/movie/${movie.id}`}
          className="mt-5 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <span>Choose showtime</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export default MovieCard
