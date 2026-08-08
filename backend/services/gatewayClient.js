const { GATEWAY_URL } = require('../config/env');

const requestGateway = async (path, payload) => {
  let response;

  try {
    response = await fetch(`${GATEWAY_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  } catch (cause) {
    const error = new Error('Gateway is unavailable');
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    status: response.status,
    data,
  };
};

const sendOtp = (phone, bookingRef) => requestGateway('/otp/send', {
  phone,
  ref: bookingRef,
});

const verifyOtp = (bookingRef, code) => requestGateway('/otp/verify', {
  ref: bookingRef,
  code,
});

const charge = (amount, currency, bookingRef, callbackUrl) => requestGateway('/charge', {
  amount,
  currency,
  booking_ref: bookingRef,
  callback_url: callbackUrl,
});

const refund = (paymentId) => requestGateway('/refund', {
  payment_id: paymentId,
});

module.exports = {
  sendOtp,
  verifyOtp,
  charge,
  refund,
};
