function Seat({ seat, isOwned = false, isSelected = false, disabled = false, onSelect }) {
  let seatStyle = "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"

  if (seat.status === "HELD") {
    seatStyle =
      "bg-yellow-500/20 text-yellow-400 cursor-not-allowed"
  }

  if (seat.status === "BOOKED") {
    seatStyle =
      "bg-red-500/20 text-red-400 cursor-not-allowed"
  }

  if (isSelected || isOwned) {
    seatStyle = "bg-white text-black ring-2 ring-white/30"
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
      aria-label={`${seat.label}, ${seat.status.toLowerCase()}, ৳${seat.price}`}
      aria-pressed={isSelected || isOwned}
      className={`
        h-11 w-11 rounded-lg disabled:hover:bg-inherit
        text-sm font-medium
        transition
        ${seatStyle}
      `}
    >
      {seat.label}
    </button>
  )
}

export default Seat
