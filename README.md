# CinemaSeat

CinemaSeat is a movie-seat booking application built for the CinemaSeat hackathon. The React frontend reads movie, showtime, and seat data from an Express API backed by MongoDB. Seat acquisition uses atomic MongoDB updates to prevent two customers from holding the same seat.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- OTP and payments: `asifmahmoud414/mock-gateway:latest`
- Recommended deployment: Vercel for the frontend, Render for the backend and gateway, MongoDB Atlas for the database

## Project structure

```text
CinemaSeat-Hackathon-/
  backend/       Express API, models, controllers, routes, and services
  frontend/      React/Vite application
  compose.yaml   Local frontend and MongoDB services
```

## Local setup

### Prerequisites

- Node.js 22 or newer
- Docker Desktop with Docker Compose
- Git

### 1. Start MongoDB

From the repository root:

```bash
docker compose up -d mongo
```

MongoDB is published on `localhost:27017` and uses a persistent Docker volume.

### 2. Start the provided gateway

Pull and run the shared hackathon gateway:

```bash
docker pull asifmahmoud414/mock-gateway:latest
docker run -d --name cinemaseat-gateway -p 9000:9000 asifmahmoud414/mock-gateway:latest
```

If the container already exists, start it with:

```bash
docker start cinemaseat-gateway
```

### 3. Configure and run the backend

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cinemaseat
HOLD_TTL_SECONDS=300
GATEWAY_URL=http://localhost:9000
PAYMENT_CURRENCY=BDT
PAYMENT_CALLBACK_URL=http://host.docker.internal:5000/api/payments/callback
```

Then run:

```bash
cd backend
npm install
npm run dev
```

The backend starts at `http://localhost:5000`. When the database collections are empty, the existing movie, show, and show-seat data is populated automatically.

Verify it:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/movies
curl http://localhost:5000/api/shows/1/seats
```

### 4. Run the frontend

The development configuration uses the real backend at `http://localhost:5000/api`.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Testing OTP and payment

The provided gateway simulates OTP delivery; it does not send a real SMS. Follow its logs while requesting an OTP from the frontend:

```bash
docker logs -f cinemaseat-gateway
```

Copy the six-digit code from a line similar to this and enter it in the frontend:

```text
OTP ref=<booking-reference> code=123456 delivered
```

The gateway intentionally introduces OTP failures, payment failures, delays, and duplicate callbacks. Press `Ctrl+C` to stop following the logs.

## Core API

```text
GET  /health
GET  /api/movies
GET  /api/movies/:movieId
GET  /api/shows/:showId/seats
POST /api/shows/:showId/holds
GET  /api/holds/:holdId
POST /api/holds/:holdId/otp/request
POST /api/holds/:holdId/otp/resend
POST /api/holds/:holdId/otp/verify
POST /api/payments
GET  /api/payments/:paymentId
GET  /api/bookings/:bookingReference
POST /api/bookings/:bookingReference/cancel
```

Seat holds expire according to `HOLD_TTL_SECONDS`. A seat can be acquired only when it is available or its previous hold has expired. Booked seats cannot be reacquired.

## Concurrency check

With the backend running and the target seat available:

```bash
cd backend
node scripts/seat-hold-concurrency.js 1 A3
```

The expected result for 100 concurrent requests is:

```text
successful holds: 1
rejections/conflicts: 99
oversell: 0
result: PASS
```

## Deployment

### MongoDB Atlas

Create an Atlas cluster, database user, and network access rule. Use a connection string ending with the CinemaSeat database name:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/cinemaseat
```

Never commit the real connection string.

### Gateway on Render

Create a Render Private Service from the existing Docker image:

```text
docker.io/asifmahmoud414/mock-gateway:latest
```

Use the Singapore region and port `9000`. Copy the internal service hostname from Render after deployment.

### Backend on Render

Create a Render Web Service connected to this repository:

```text
Root Directory: backend
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

Configure:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/cinemaseat
HOLD_TTL_SECONDS=300
PAYMENT_CURRENCY=BDT
GATEWAY_URL=http://RENDER_GATEWAY_INTERNAL_HOST:9000
PAYMENT_CALLBACK_URL=https://YOUR-BACKEND.onrender.com/api/payments/callback
```

Do not set `PORT` manually; Render provides it. Deploy the backend and confirm that its public `/health` endpoint returns `200`.

Render free web services sleep after inactivity. For a reliable live demonstration, use always-on instances for both the backend and gateway.

### Frontend on Vercel

Import the repository into Vercel with these settings:

```text
Root Directory: frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

Add these Vercel environment variables:

```env
VITE_API_MODE=remote
VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api
```

Redeploy after changing a `VITE_` variable because Vite embeds these values during the build.

## Useful checks

```bash
# Frontend quality checks
cd frontend
npm run lint
npm run build

# Running containers
docker ps

# Backend health
curl http://localhost:5000/health
```

## Important notes

- Do not commit `.env` files or database credentials.
- Do not expose MongoDB port `27017` publicly in production.
- The mock gateway is intentionally unreliable; handle clean failures and delayed callbacks.
- Keep `/health` independent of MongoDB and gateway calls so infrastructure health checks return quickly.
