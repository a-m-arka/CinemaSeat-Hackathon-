const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { movieToJSON, showToJSON } = require('../services/cinemaPresenter');

const getMovies = async (req, res, next) => {
  try {
    const movies = await Movie.find().sort({ id: 1 }).lean();
    return res.status(200).json({ movies: movies.map(movieToJSON) });
  } catch (error) {
    return next(error);
  }
};

const getMovie = async (req, res, next) => {
  const movieId = Number(req.params.movieId);

  if (!Number.isInteger(movieId)) {
    return res.status(400).json({ message: 'movieId must be a number' });
  }

  try {
    const movie = await Movie.findOne({ id: movieId }).lean();
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const shows = await Show.find({ movieId }).sort({ dateTime: 1 }).lean();
    return res.status(200).json({
      movie: movieToJSON(movie),
      showtimes: shows.map((show) => showToJSON(show)),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMovies,
  getMovie,
};
