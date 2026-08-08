const express = require('express');
const {
  getShowSeats,
  holdShowSeat,
} = require('../controllers/showSeatController');

const router = express.Router();

router.get('/:showId/seats', getShowSeats);
router.post('/:showId/hold', holdShowSeat);

module.exports = router;
