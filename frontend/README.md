# CinemaSeat frontend

React/Vite booking UI for movie discovery, seat holds, phone verification, and asynchronous payment confirmation. The frontend demo includes an 80-seat auditorium with separate halls, show times, a center aisle, and tier pricing, so it runs without a backend.

## Configuration

The default `mock` mode provides the complete flow in the browser and persists booking state in local storage. Use OTP `123456`. A normal phone number produces a successful demo payment after a short pending state; a number ending in `0000` demonstrates failure, and one ending in `9999` demonstrates a gateway outage.

```sh
npm install
npm run dev
```

To use a real API, create `.env`:

```env
VITE_API_MODE=remote
VITE_API_BASE_URL=http://localhost:3000/api
```

`VITE_API_BASE_URL` is the only backend base URL used by the application. Payment gateway credentials must remain in the backend; the frontend neither reads nor embeds them.

The backend should expose these routes below the configured base URL:

- `GET /movies`, `GET /movies/:movieId`
- `GET /shows/:showId/seats`, `POST /shows/:showId/holds`
- `GET /holds/:holdId`
- `POST /holds/:holdId/otp/request`, `/otp/resend`, and `/otp/verify`
- `POST /payments`, `GET /payments/:paymentId`
- `GET /bookings/:bookingReference`, `POST /bookings/:bookingReference/cancel`

The hold request sends `seatIds` with one to four IDs. Hold responses should return `seatIds`, `seatLabels`, per-seat snapshots containing `tier` and `price`, the combined `price` (or `totalPrice`), and an ISO-8601 `expiresAt`; the frontend never invents a countdown. To keep the final ticket complete after refresh, hold and payment responses should also snapshot `showId`, `movieId`, `movieTitle`, `theatre`, `showTime`, and `showDate`. Payment responses use `PENDING`, `SUCCEEDED`, or `FAILED`; booking status uses `CONFIRMED` or `CANCELLED`. A successful cancellation should return its refund status and release the completed hold.

## Docker Compose

From the repository root:

```sh
docker compose up --build
```

The site is served at `http://localhost:8080` in mock mode. Set `FRONTEND_PORT` to change that port. To build against a backend, pass both `VITE_API_MODE=remote` and `VITE_API_BASE_URL=http://localhost:3000/api`. Because Vite variables are compiled into the browser bundle, changing them requires rebuilding the image.
