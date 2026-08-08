const express = require('express');
const { getBooking } = require('../controllers/bookingController');

const router = express.Router();

router.get('/:bookingRef', getBooking);

module.exports = router;
