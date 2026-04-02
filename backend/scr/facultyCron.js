const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const facultyScraper = require('./facultyScraper');
const cron = require('node-cron');

// Schedule to refresh faculty data every day at 2am
cron.schedule('0 2 * * *', async () => {
  try {
    await facultyScraper();
    console.log('Faculty data refreshed by cron job.');
  } catch (err) {
    console.error('Faculty cron refresh failed:', err);
  }
});

// To run: node facultyCron.js
if (require.main === module) {
  console.log('Faculty cron job started.');
}
