const express = require('express');
const {
  getPayment,
  handlePaymentCallback,
  startPayment,
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/callback', handlePaymentCallback);
router.post('/', startPayment);
router.get('/:paymentId', getPayment);

module.exports = router;
