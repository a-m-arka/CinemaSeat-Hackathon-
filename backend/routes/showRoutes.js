const express = require('express');
const {
  getShowSeats,
  holdShowSeat,
  holdShowSeats,
} = require('../controllers/showSeatController');

const router = express.Router();

router.get('/:showId/seats', getShowSeats);
router.post('/:showId/hold', holdShowSeat);
router.post('/:showId/holds', holdShowSeats);

module.exports = router;
