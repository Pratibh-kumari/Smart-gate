// Check OTPs in Database
require('dotenv').config();
const mongoose = require('mongoose');
const Visitor = require('./models/Visitor');

async function checkOTPs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const visitors = await Visitor.find({ otp: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('='.repeat(60));
    console.log('📱 OTPs Currently Stored in Database');
    console.log('='.repeat(60));
    
    if (visitors.length === 0) {
      console.log('\n❌ No active OTPs found in database.');
      console.log('   Register a visitor to see OTP here.\n');
    } else {
      console.log(`\n✅ Found ${visitors.length} visitor(s) with OTP:\n`);
      
      visitors.forEach((v, i) => {
        const isExpired = v.otpExpires && v.otpExpires < new Date();
        const status = isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
        
        console.log(`${i + 1}. ${v.name}`);
        console.log(`   Phone:   ${v.phone}`);
        console.log(`   OTP:     ${v.otp} ${status}`);
        console.log(`   Expires: ${v.otpExpires}`);
        console.log(`   Status:  ${v.status}`);
        console.log('   ' + '-'.repeat(50));
      });
    }
    
    console.log('\n📊 Database: smart-gate → visitors collection');
    console.log('🔗 Location: mongodb://127.0.0.1:27017/smart-gate\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOTPs();
