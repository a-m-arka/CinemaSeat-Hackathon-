import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import MoviePage from "./pages/MoviePage"
import SeatSelectionPage from "./pages/SeatSelectionPage"


function App() {
  return (
    <BrowserRouter>

      <div className="min-h-screen bg-zinc-950 text-white">

        <Navbar />

        <Routes>

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/movie/:movieId"
            element={<MoviePage />}
          />

          <Route
            path="/show/:showId/seats"
            element={<SeatSelectionPage />}
          />

        </Routes>

      </div>

    </BrowserRouter>
  )
}

export default App