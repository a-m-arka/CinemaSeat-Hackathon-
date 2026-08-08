import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom"

import Navbar from "./components/Navbar"

import HomePage from "./pages/HomePage"
import MoviePage from "./pages/MoviePage"
import SeatSelectionPage from "./pages/SeatSelectionPage"
import MyBookingPage from "./pages/MyBookingPage"


function NotFoundPage() {
  return (
    <main
      className="
        mx-auto
        flex
        min-h-[70vh]
        max-w-xl
        flex-col
        items-center
        justify-center
        px-6
        text-center
      "
    >

      <p
        className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.3em]
          text-zinc-500
        "
      >
        Error 404
      </p>


      <h1
        className="
          mt-4
          text-4xl
          font-bold
          tracking-tight
          sm:text-5xl
        "
      >
        That page is not showing
      </h1>


      <p
        className="
          mt-4
          max-w-md
          leading-7
          text-zinc-400
        "
      >
        The page may have moved, expired, or never existed.
        Head back to the movie list and start again.
      </p>


      <Link
        to="/"
        className="
          mt-8
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
          focus-visible:ring-offset-zinc-950
        "
      >
        Browse movies
      </Link>

    </main>
  )
}


function App() {
  return (
    <BrowserRouter>

      <div
        className="
          flex
          min-h-screen
          flex-col
          bg-zinc-950
          text-white
        "
      >

        <Navbar />


        <div className="flex-1">

          <Routes>

            {/* HOME */}
            <Route
              path="/"
              element={<HomePage />}
            />


            {/* MOVIE DETAILS */}
            <Route
              path="/movie/:movieId"
              element={<MoviePage />}
            />


            {/* SEAT SELECTION + CHECKOUT */}
            <Route
              path="/show/:showId/seats"
              element={<SeatSelectionPage />}
            />


            {/* MOST RECENT BOOKING */}
            <Route
              path="/my-booking"
              element={<MyBookingPage />}
            />


            {/* 404 */}
            <Route
              path="*"
              element={<NotFoundPage />}
            />

          </Routes>

        </div>


        {/* FOOTER */}
        <footer
          className="
            mt-16
            border-t
            border-zinc-900
            px-6
            py-8
          "
        >

          <div
            className="
              mx-auto
              flex
              max-w-7xl
              flex-col
              justify-between
              gap-4
              text-sm
              text-zinc-600
              sm:flex-row
              sm:items-center
            "
          >

            <p>
              © CinemaSeat
            </p>


            <p>
              Reliable booking when everyone wants the same seat.
            </p>

          </div>

        </footer>

      </div>

    </BrowserRouter>
  )
}

export default App