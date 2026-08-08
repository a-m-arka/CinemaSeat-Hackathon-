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

  useEffect(() => {
    let active = true

    async function loadMovie() {
      setLoading(true)
      setError("")
      try {
        const { data } = await apiClient.get(`/movies/${movieId}`)
        if (active) {
          setMovie(data.movie || data)
          setShowtimes(data.showtimes || data.movie?.showtimes || [])
        }
      } catch (loadError) {
        if (active) setError(apiErrorMessage(loadError, "Movie details could not be loaded."))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMovie()
    return () => { active = false }
  }, [movieId])

  if (loading) return <main className="mx-auto max-w-7xl animate-pulse px-6 py-10"><div className="h-10 w-2/3 rounded bg-zinc-900" /><div className="mt-10 h-36 rounded-xl bg-zinc-900" /></main>

  if (error) return <main className="mx-auto max-w-3xl px-6 py-10"><InlineNotice>{error}</InlineNotice><Link to="/" className="mt-5 inline-block text-sm text-zinc-300 underline">Back to movies</Link></main>

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <p className="text-sm uppercase tracking-widest text-zinc-500">{movie?.genre || `Movie #${movieId}`}</p>
      <h1 className="mt-2 text-4xl font-bold">{movie?.title}</h1>
      <p className="mt-3 text-zinc-400">{[movie?.duration, movie?.rating].filter(Boolean).join(" · ") || "Select a showtime to continue to seat selection."}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Today&apos;s Showtimes</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {showtimes.map((show) => (
            <Link key={show.id} to={`/show/${show.id}/seats`} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600">
              <p className="text-xl font-semibold">{show.time}</p>
              <p className="mt-1 text-sm text-zinc-400">{show.theatre}{show.date ? ` · ${show.date}` : ""}</p>
            </Link>
          ))}
        </div>
        {showtimes.length === 0 && <p className="mt-5 text-zinc-400">No showtimes are available today.</p>}
      </section>
    </main>
  )
}

export default MoviePage
