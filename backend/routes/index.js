const express = require('express');
const bookingRoutes = require('./bookingRoutes');
const holdRoutes = require('./holdRoutes');
const movieRoutes = require('./movieRoutes');
const paymentRoutes = require('./paymentRoutes');
const showRoutes = require('./showRoutes');

const router = express.Router();

router.use('/movies', movieRoutes);
router.use('/shows', showRoutes);
router.use('/holds', holdRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
