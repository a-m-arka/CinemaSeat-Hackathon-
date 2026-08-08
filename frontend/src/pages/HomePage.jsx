import { useEffect, useState } from "react"
import apiClient, { apiErrorMessage } from "../api/client"
import InlineNotice from "../components/InlineNotice"
import MovieCard from "../components/MovieCard"

function MovieCardSkeleton() {
  return <div className="aspect-[2/3] animate-pulse rounded-xl bg-zinc-900" />
}

function HomePage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadMovies() {
    setLoading(true)
    setError("")
    try {
      const { data } = await apiClient.get("/movies")
      setMovies(data.movies || data)
    } catch (loadError) {
      setError(apiErrorMessage(loadError, "Movies could not be loaded."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function fetchMovies() {
      try {
        const { data } = await apiClient.get("/movies")
        if (active) setMovies(data.movies || data)
      } catch (loadError) {
        if (active) setError(apiErrorMessage(loadError, "Movies could not be loaded."))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchMovies()
    return () => { active = false }
  }, [])

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-widest text-zinc-500">Now Showing</p>
        <h1 className="mt-2 text-4xl font-bold">Pick a movie</h1>
        <p className="mt-3 text-zinc-400">Choose your showtime and reserve your seat before someone else does.</p>
      </div>

      {error && (
        <div className="mb-6 space-y-3">
          <InlineNotice>{error}</InlineNotice>
          <button type="button" onClick={loadMovies} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500">Try again</button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy={loading}>
        {loading
          ? Array.from({ length: 3 }, (_, index) => <MovieCardSkeleton key={index} />)
          : movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>

      {!loading && !error && movies.length === 0 && <p className="text-zinc-400">No movies are showing right now.</p>}
    </main>
  )
}

export default HomePage
