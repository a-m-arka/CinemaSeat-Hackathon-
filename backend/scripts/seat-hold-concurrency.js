require('dotenv').config();

const REQUEST_COUNT = 100;
const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const [showId = '1', seatId = 'F12'] = process.argv.slice(2);

const readResponse = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const holdSeat = async () => {
  try {
    const response = await fetch(
      `${baseUrl}/api/shows/${encodeURIComponent(showId)}/hold`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId }),
      }
    );

    return {
      status: response.status,
      body: await readResponse(response),
    };
  } catch (error) {
    return {
      status: 0,
      body: { message: error.message },
    };
  }
};

const run = async () => {
  const results = await Promise.all(
    Array.from({ length: REQUEST_COUNT }, () => holdSeat())
  );

  const successfulHolds = results.filter(({ status }) => status === 201).length;
  const conflicts = results.filter(({ status }) => status === 409).length;
  const otherResponses = results.filter(
    ({ status }) => status !== 201 && status !== 409
  ).length;

  let matchingSeats = [];
  let seatMapStatus = 0;

  try {
    const response = await fetch(
      `${baseUrl}/api/shows/${encodeURIComponent(showId)}/seats`
    );
    seatMapStatus = response.status;
    const body = await readResponse(response);
    matchingSeats = Array.isArray(body?.seats)
      ? body.seats.filter((seat) => seat.seatId === seatId)
      : [];
  } catch {
    matchingSeats = [];
  }

  const heldSeatCount = matchingSeats.filter((seat) => seat.status === 'HELD').length;
  const seatHeldExactlyOnce = matchingSeats.length === 1 && heldSeatCount === 1;
  const oversell = Math.max(successfulHolds - 1, 0);
  const passed = successfulHolds === 1
    && conflicts === REQUEST_COUNT - 1
    && otherResponses === 0
    && seatMapStatus === 200
    && seatHeldExactlyOnce;

  console.log(`showId: ${showId}`);
  console.log(`seatId: ${seatId}`);
  console.log(`requests sent: ${REQUEST_COUNT}`);
  console.log(`successful holds: ${successfulHolds}`);
  console.log(`rejections/conflicts: ${conflicts}`);
  console.log(`other responses: ${otherResponses}`);
  console.log(`oversell: ${oversell}`);
  console.log(`seat-map status: ${seatMapStatus}`);
  console.log(`target seat HELD exactly once: ${seatHeldExactlyOnce}`);
  console.log(`result: ${passed ? 'PASS' : 'FAIL'}`);

  if (!passed) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(`Concurrency test failed: ${error.message}`);
  process.exitCode = 1;
});
