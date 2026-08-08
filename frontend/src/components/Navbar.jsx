import {
  Link,
  NavLink,
} from "react-router-dom"


function Navbar() {

  const navigationClass = ({ isActive }) => `
    relative
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    transition

    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-white

    ${
      isActive
        ? "bg-zinc-800 text-white"
        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
    }
  `


  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-zinc-900
        bg-zinc-950/85
        backdrop-blur-xl
      "
    >

      <nav
        className="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
          px-4
          py-3
          sm:px-6
        "
      >

        {/* LOGO */}
        <Link
          to="/"
          className="
            group
            flex
            items-center
            gap-3
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-white
          "
        >

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-white
              font-black
              text-black
              transition
              group-hover:scale-105
            "
          >
            C
          </div>


          <div>

            <p
              className="
                text-lg
                font-bold
                leading-none
                tracking-tight
              "
            >
              CinemaSeat
            </p>


            <p
              className="
                mt-1
                hidden
                text-[10px]
                uppercase
                tracking-[0.2em]
                text-zinc-600
                sm:block
              "
            >
              Live booking
            </p>

          </div>

        </Link>


        {/* NAVIGATION */}
        <div className="flex items-center gap-1 sm:gap-2">

          <NavLink
            to="/"
            end
            className={navigationClass}
          >
            Movies
          </NavLink>


          <NavLink
            to="/my-booking"
            className={navigationClass}
          >
            My Booking
          </NavLink>

        </div>

      </nav>

    </header>
  )
}

export default Navbar