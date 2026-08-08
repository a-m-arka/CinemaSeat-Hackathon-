const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const ShowSeat = require('../models/ShowSeat');
const data = require('../data/data.json');
const { priceForRow } = require('../services/cinemaPresenter');

const createShowSeats = () => data.shows.flatMap((show) => (
  Object.entries(show.seatPlan).flatMap(([row, seats]) => (
    Object.entries(seats).map(([number, status]) => ({
      showId: show.id,
      seatId: `${row}${number}`,
      row,
      number: Number(number),
      price: priceForRow(row),
      status: String(status).toUpperCase() === 'BOOKED' ? 'BOOKED' : 'AVAILABLE',
      bookingRef: null,
      holdExpiresAt: null,
    }))
  ))
));

const seedData = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    const showCount = await Show.countDocuments();
    const showSeatCount = await ShowSeat.countDocuments();

    if (movieCount === 0) await Movie.insertMany(data.movies);
    if (showCount === 0) await Show.insertMany(data.shows);
    if (showSeatCount === 0) await ShowSeat.insertMany(createShowSeats());

    console.log('Database seed check complete.');
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
  }
};

module.exports = seedData;
