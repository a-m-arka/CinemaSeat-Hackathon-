import { BrowserRouter, Routes, Route } from "react-router-dom";
import CheckoutPage from "./pages/CheckoutPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import MoviePage from "./pages/MoviePage";
import SeatSelectionPage from "./pages/SeatSelectionPage";

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <p className="text-sm uppercase tracking-widest text-zinc-500">404</p>
      <h1 className="mt-2 text-4xl font-bold">That page is not showing</h1>
      <a
        href="/"
        className="mt-6 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-black"
      >
        Browse movies
      </a>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar />

        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/" element={<HomePage />} />

          <Route path="/movie/:movieId" element={<MoviePage />} />

          <Route path="/show/:showId/seats" element={<SeatSelectionPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
