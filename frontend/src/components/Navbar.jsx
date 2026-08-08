function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <h1 className="text-2xl font-bold">
          CinemaSeat
        </h1>

        <div className="flex items-center gap-6 text-sm text-zinc-300">
          <a href="/" className="hover:text-white">
            Movies
          </a>

          <a href="#" className="hover:text-white">
            My Booking
          </a>
        </div>

      </div>
    </nav>
  )
}

export default Navbar