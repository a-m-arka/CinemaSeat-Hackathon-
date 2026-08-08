import MovieCard from "../components/MovieCard"

function HomePage() {

  const movies = [
    {
      id: 1,
      title: "Spider-Man: Brand New Day",
      genre: "Action • Adventure",
      poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"
    },

    {
      id: 2,
      title: "The Final Horizon",
      genre: "Sci-Fi • Drama",
      poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1"
    },

    {
      id: 3,
      title: "Midnight Run",
      genre: "Thriller • Mystery",
      poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728"
    }
  ]

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      <div className="mb-10">

        <p className="text-sm uppercase tracking-widest text-zinc-500">
          Now Showing
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Pick a movie
        </h1>

        <p className="mt-3 text-zinc-400">
          Choose your showtime and reserve your seat before someone else does.
        </p>

      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
          />
        ))}

      </div>

    </main>
  )
}

export default HomePage