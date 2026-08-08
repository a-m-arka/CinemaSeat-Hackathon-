const express = require('express');
const { getHold } = require('../controllers/holdController');
const {
  requestHoldOtp,
  verifyHoldOtp,
} = require('../controllers/paymentController');

const router = express.Router();

router.get('/:holdId', getHold);
router.post('/:holdId/otp/request', requestHoldOtp);
router.post('/:holdId/otp/resend', requestHoldOtp);
router.post('/:holdId/otp/verify', verifyHoldOtp);

module.exports = router;
