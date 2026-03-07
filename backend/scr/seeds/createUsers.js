// Seed Script to Create Default Users
// Run: node scr/seeds/createUsers.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const defaultUsers = [
  {
    name: 'Guard User',
    email: 'guard@rru.ac.in',
    password: 'guard123',
    phone: '9876543210',
    role: 'guard'
  },
  {
    name: 'Host User',
    email: 'host@rru.ac.in',
    password: 'host123',
    phone: '9876543211',
    role: 'host'
  },
  {
    name: 'Admin User',
    email: 'admin@rru.ac.in',
    password: 'admin123',
    phone: '9876543212',
    role: 'host' // Admin uses host role for approvals
  }
];

async function createUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create users
    for (const userData of defaultUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role,
        isActive: true
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.role}) - Password: ${userData.password}`);
    }

    console.log('\n🎉 All users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────────────────────');
    defaultUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()} Portal:`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
    console.log('─────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    process.exit(1);
  }
}

createUsers();
