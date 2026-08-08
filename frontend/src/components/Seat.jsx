function Seat({ seat, selectedSeat, onSelect }) {

  const isSelected = selectedSeat?.id === seat.id

  let seatStyle =
    "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"

  if (seat.status === "HELD") {
    seatStyle =
      "bg-yellow-500/20 text-yellow-400 cursor-not-allowed"
  }

  if (seat.status === "BOOKED") {
    seatStyle =
      "bg-red-500/20 text-red-400 cursor-not-allowed"
  }

  if (isSelected) {
    seatStyle =
      "bg-white text-black"
  }

  const handleClick = () => {

    if (
      seat.status === "HELD" ||
      seat.status === "BOOKED"
    ) {
      return
    }

    onSelect(seat)
  }


  return (
    <button
      onClick={handleClick}
      className={`
        h-11 w-11 rounded-lg
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