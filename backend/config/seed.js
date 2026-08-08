const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const data = require('../data/data.json');

const seedData = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    const showCount = await Show.countDocuments();

    if (movieCount === 0 && showCount === 0) {
      console.log('Database empty. Seeding data...');
      
      const createdMovies = await Movie.insertMany(data.movies);
      await Show.insertMany(data.shows);
      
      console.log('Database seeded successfully!');
    } else {
      console.log('Database already populated. Skipping seed.');
    }
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
  }
};

module.exports = seedData;
