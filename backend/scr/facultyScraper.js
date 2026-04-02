// Scraper script to fetch faculty data from https://rru.ac.in/faculty and update MongoDB
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-gate';

async function scrapeFaculty() {
  await mongoose.connect(MONGO_URI);
  const url = 'https://rru.ac.in/faculty';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const facultyList = [];

  // Adjust selectors as per actual HTML structure
  $('.faculty-card').each((i, el) => {
    const name = $(el).find('.faculty-name').text().trim();
    const email = $(el).find('.faculty-email').text().trim();
    const phone = $(el).find('.faculty-phone').text().trim();
    const department = $(el).find('.faculty-department').text().trim();
    const designation = $(el).find('.faculty-designation').text().trim();
    const profileUrl = $(el).find('a').attr('href');
    if (name && email) {
      facultyList.push({ name, email, phone, department, designation, profileUrl });
    }
  });

  // Remove all old records and insert new
  await Faculty.deleteMany({});
  await Faculty.insertMany(facultyList);
  console.log(`Inserted ${facultyList.length} faculty records.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  scrapeFaculty().catch(console.error);
}
