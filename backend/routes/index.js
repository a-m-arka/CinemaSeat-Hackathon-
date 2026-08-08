const express = require('express');
const bookingRoutes = require('./bookingRoutes');
const showRoutes = require('./showRoutes');

const router = express.Router();

router.use('/shows', showRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;
