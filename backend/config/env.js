const parsedHoldTtl = Number.parseInt(process.env.HOLD_TTL_SECONDS, 10);

const HOLD_TTL_SECONDS = Number.isInteger(parsedHoldTtl) && parsedHoldTtl > 0
  ? parsedHoldTtl
  : 300;

module.exports = {
  HOLD_TTL_SECONDS,
};
