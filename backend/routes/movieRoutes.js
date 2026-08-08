const express = require('express');
const { getMovies, getMovie } = require('../controllers/movieController');

const router = express.Router();

router.get('/', getMovies);
router.get('/:movieId', getMovie);

module.exports = router;
