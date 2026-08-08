const parsedHoldTtl = Number.parseInt(process.env.HOLD_TTL_SECONDS, 10);

const HOLD_TTL_SECONDS = Number.isInteger(parsedHoldTtl) && parsedHoldTtl > 0
  ? parsedHoldTtl
  : 300;

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:9000';
const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || 'BDT';
const PAYMENT_CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL
  || `http://host.docker.internal:${process.env.PORT || 5000}/api/payments/callback`;

module.exports = {
  HOLD_TTL_SECONDS,
  GATEWAY_URL,
  PAYMENT_CURRENCY,
  PAYMENT_CALLBACK_URL,
};
