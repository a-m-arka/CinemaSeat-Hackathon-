function Seat({ seat, isOwned = false, isSelected = false, disabled = false, onSelect }) {
  let seatStyle = "border-white/10 bg-white/[0.06] text-zinc-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-violet-500/20 hover:text-white hover:shadow-[0_10px_25px_rgba(91,33,182,0.18)] disabled:hover:translate-y-0 disabled:hover:border-white/10 disabled:hover:bg-white/[0.06] disabled:hover:text-zinc-300 disabled:hover:shadow-none"

  if (seat.status === "HELD") {
    seatStyle =
      "border-amber-400/20 bg-amber-500/10 text-amber-300 cursor-not-allowed"
  }

  if (seat.status === "BOOKED") {
    seatStyle =
      "border-rose-400/15 bg-rose-500/10 text-rose-300/70 cursor-not-allowed"
  }

  if (isSelected || isOwned) {
    seatStyle = "border-violet-300 bg-gradient-to-b from-violet-300 to-violet-500 text-violet-950 ring-4 ring-violet-500/15 shadow-[0_12px_30px_rgba(139,92,246,0.35)]"
  }

  const handleClick = () => {
    if (disabled || seat.status !== "AVAILABLE") return
    onSelect(seat)
  }


  return (
    <button
      onClick={handleClick}
      type="button"
      disabled={disabled || seat.status !== "AVAILABLE"}
      aria-label={`${seat.label}, ${seat.tier || "Standard"}, ${seat.status.toLowerCase()}, ৳${seat.price}`}
      aria-pressed={isSelected || isOwned}
      className={`
        h-12 w-14 rounded-xl border
        text-sm font-bold
        transition duration-200
        ${seatStyle}
      `}
    >
      {seat.label}
    </button>
  )
}

export default Seat
