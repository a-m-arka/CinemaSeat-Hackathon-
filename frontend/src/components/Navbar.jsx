import { Link, NavLink } from "react-router-dom"

function Navbar() {
  const navigationClass = ({ isActive }) => `
    rounded-full px-4 py-2.5 text-sm font-semibold transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
    ${isActive
      ? "bg-white text-zinc-950 shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
      : "text-zinc-400 hover:bg-white/5 hover:text-white"}
  `

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08080d]/80 backdrop-blur-2xl">
      <nav className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 font-black text-white shadow-[0_10px_35px_rgba(139,92,246,0.35)] transition group-hover:rotate-3 group-hover:scale-105">
            <span className="relative z-10">CS</span>
            <span className="absolute -right-2 -top-3 h-8 w-8 rounded-full bg-white/30 blur-md" />
          </div>
          <div>
            <p className="text-lg font-black leading-none tracking-[-0.03em]">CinemaSeat</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-violet-300/70">Premium booking</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/5 bg-white/[0.025] p-1.5 sm:flex">
          <NavLink to="/" end className={navigationClass}>Movies</NavLink>
          <NavLink to="/my-booking" className={navigationClass}>My Profile</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="text-xs font-semibold text-zinc-300">Dhaka, Bangladesh</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-600">Choose your cinema</p>
          </div>
          <NavLink
            to="/my-booking"
            className="hidden h-11 items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 text-sm font-semibold text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20 lg:flex"
          >
            <span aria-hidden="true">✦</span>
            <span className="hidden lg:inline">Profile</span>
          </NavLink>
        </div>
      </nav>

      <div className="mx-auto flex max-w-[1440px] justify-center gap-2 px-5 pb-3 sm:hidden">
        <NavLink to="/" end className={navigationClass}>Movies</NavLink>
        <NavLink to="/my-booking" className={navigationClass}>My Profile</NavLink>
      </div>
    </header>
  )
}

export default Navbar
