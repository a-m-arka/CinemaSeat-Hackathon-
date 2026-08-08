import { useEffect, useState } from "react"

export default function useCountdown(expiresAt) {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!expiresAt) return undefined

    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  const remainingMs = Math.max(0, Date.parse(expiresAt || 0) - now)
  const totalSeconds = Math.ceil(remainingMs / 1000)
  return {
    remainingMs,
    formatted: `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`,
  }
}
