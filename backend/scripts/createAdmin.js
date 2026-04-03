/**
 * Create Admin User Script
 * Usage: node backend/scripts/createAdmin.js
 *
 * Customize ADMIN_EMAIL and ADMIN_PASSWORD below before running.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User     = require('../models/User');

// ── Admin credentials — change these ──────────────────────────────────────────
const ADMIN_EMAIL     = 'admin@propmaintain.com';
const ADMIN_PASSWORD  = 'Admin@1234';
const ADMIN_FIRSTNAME = 'Admin';
const ADMIN_LASTNAME  = 'User';
// ──────────────────────────────────────────────────────────────────────────────

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

    if (existing) {
      if (existing.role === 'admin') {
        // Reset password in case it was double-hashed before
        existing.password        = ADMIN_PASSWORD; // model pre-save hook will hash it
        existing.isEmailVerified = true;
        existing.isActive        = true;
        await existing.save();
        console.log(`✅ Admin account updated: ${ADMIN_EMAIL}`);
      } else {
        existing.role            = 'admin';
        existing.password        = ADMIN_PASSWORD;
        existing.isEmailVerified = true;
        existing.isActive        = true;
        await existing.save();
        console.log(`✅ Existing account upgraded to admin: ${ADMIN_EMAIL}`);
      }
      console.log('');
      console.log('🎉 Admin account ready!');
      console.log('──────────────────────────────────────');
      console.log(`   Email    : ${ADMIN_EMAIL}`);
      console.log(`   Password : ${ADMIN_PASSWORD}`);
      console.log('──────────────────────────────────────');
      console.log('   Login at : http://localhost:3000/auth/login');
      console.log('');
      process.exit(0);
    }

    // Pass plain password — the User model pre-save hook handles hashing
    await User.create({
      firstName:       ADMIN_FIRSTNAME,
      lastName:        ADMIN_LASTNAME,
      email:           ADMIN_EMAIL,
      password:        ADMIN_PASSWORD,
      role:            'admin',
      isEmailVerified: true,
      isActive:        true,
      agreeToTerms:    true,
    });

    console.log('');
    console.log('🎉 Admin account created successfully!');
    console.log('──────────────────────────────────────');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log('──────────────────────────────────────');
    console.log('   Login at : http://localhost:3000/auth/login');
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
