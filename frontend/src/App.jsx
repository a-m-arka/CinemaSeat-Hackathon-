import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import MoviePage from "./pages/MoviePage"

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

        </Routes>

      </div>

    </BrowserRouter>
  )
}

export default App