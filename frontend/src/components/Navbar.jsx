import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <Link to="/" className="text-2xl font-bold">CinemaSeat</Link>

        <div className="flex items-center gap-6 text-sm text-zinc-300">
          <Link to="/" className="hover:text-white">
            Movies
          </Link>
        </div>

      </div>
    </nav>
  )
}

export default Navbar
