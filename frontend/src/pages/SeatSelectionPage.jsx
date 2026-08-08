import { useState } from "react"
import { useParams } from "react-router-dom"
import Seat from "../components/Seat"


function SeatSelectionPage() {

  const { showId } = useParams()

  const [selectedSeat, setSelectedSeat] = useState(null)


  const seats = [
    { id: 1, label: "A1", status: "AVAILABLE", price: 450 },
    { id: 2, label: "A2", status: "AVAILABLE", price: 450 },
    { id: 3, label: "A3", status: "BOOKED", price: 450 },
    { id: 4, label: "A4", status: "AVAILABLE", price: 450 },
    { id: 5, label: "A5", status: "HELD", price: 450 },
    { id: 6, label: "A6", status: "AVAILABLE", price: 450 },

    { id: 7, label: "B1", status: "AVAILABLE", price: 450 },
    { id: 8, label: "B2", status: "AVAILABLE", price: 450 },
    { id: 9, label: "B3", status: "AVAILABLE", price: 450 },
    { id: 10, label: "B4", status: "AVAILABLE", price: 450 },
    { id: 11, label: "B5", status: "BOOKED", price: 450 },
    { id: 12, label: "B6", status: "AVAILABLE", price: 450 },

    { id: 13, label: "C1", status: "AVAILABLE", price: 500 },
    { id: 14, label: "C2", status: "AVAILABLE", price: 500 },
    { id: 15, label: "C3", status: "AVAILABLE", price: 500 },
    { id: 16, label: "C4", status: "AVAILABLE", price: 500 },
    { id: 17, label: "C5", status: "AVAILABLE", price: 500 },
    { id: 18, label: "C6", status: "AVAILABLE", price: 500 },
  ]


  const handleHoldSeat = () => {

    if (!selectedSeat) {
      return
    }

    console.log(
      "Holding seat:",
      selectedSeat
    )
  }


  return (
    <main className="mx-auto max-w-5xl px-6 py-10">

      <div>

        <p className="text-sm uppercase tracking-widest text-zinc-500">
          Show #{showId}
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Choose your seat
        </h1>

        <p className="mt-3 text-zinc-400">
          Select one available seat to continue.
        </p>

      </div>


      <div className="mt-12">

        <div className="mx-auto max-w-2xl">

          <div className="h-2 rounded-full bg-zinc-700" />

          <p className="mt-3 text-center text-xs uppercase tracking-[0.35em] text-zinc-500">
            Screen
          </p>

        </div>


        <div className="mt-12 grid grid-cols-6 gap-3 place-content-center">

          {seats.map((seat) => (

            <Seat
              key={seat.id}
              seat={seat}
              selectedSeat={selectedSeat}
              onSelect={setSelectedSeat}
            />

          ))}

        </div>

      </div>


      <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-zinc-800" />
          <span className="text-zinc-400">
            Available
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-white" />
          <span className="text-zinc-400">
            Selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-yellow-500/30" />
          <span className="text-zinc-400">
            Held
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500/30" />
          <span className="text-zinc-400">
            Booked
          </span>
        </div>

      </div>


      <div className="mx-auto mt-10 max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-6">

        {selectedSeat ? (

          <>
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-zinc-400">
                  Selected seat
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {selectedSeat.label}
                </p>
              </div>

              <div className="text-right">

                <p className="text-sm text-zinc-400">
                  Price
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  ৳{selectedSeat.price}
                </p>

              </div>

            </div>


            <button
              onClick={handleHoldSeat}
              className="mt-6 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-zinc-200"
            >
              Hold Seat
            </button>

          </>

        ) : (

          <p className="text-center text-zinc-400">
            Select an available seat.
          </p>

        )}

      </div>

    </main>
  )
}

export default SeatSelectionPage