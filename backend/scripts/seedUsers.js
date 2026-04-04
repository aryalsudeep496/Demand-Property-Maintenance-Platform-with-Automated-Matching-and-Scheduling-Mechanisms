/**
 * Seed Demo Users Script
 * Creates one account for every role: admin, customer, and service provider.
 *
 * Usage: node backend/scripts/seedUsers.js
 *
 * Existing accounts with the same email are updated (password reset),
 * so this script is safe to run multiple times.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User     = require('../models/User');

// ── Demo credentials ──────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    role:        'admin',
    firstName:   'Admin',
    lastName:    'User',
    email:       'admin@propmaintain.com',
    password:    'Admin@1234',
  },
  {
    role:        'customer',
    firstName:   'John',
    lastName:    'Customer',
    email:       'customer@propmaintain.com',
    password:    'Customer@1234',
  },
  {
    role:        'provider',
    firstName:   'Jane',
    lastName:    'Provider',
    email:       'provider@propmaintain.com',
    password:    'Provider@1234',
    providerProfile: {
      businessName:       'Jane\'s Maintenance Co.',
      serviceCategories:  ['home_repair', 'home_upgrade'],
      skills:             ['Plumbing', 'Painting', 'Carpentry'],
      bio:                'Experienced property maintenance professional with 10+ years in the field.',
      availabilityRadius: 30,
      isAvailable:        true,
      isVerified:         true,
    },
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const upsertUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email }).select('+password');

  if (existing) {
    // Reset to demo password and ensure account is active + verified
    existing.firstName       = userData.firstName;
    existing.lastName        = userData.lastName;
    existing.password        = userData.password;   // pre-save hook hashes it
    existing.role            = userData.role;
    existing.isEmailVerified = true;
    existing.isActive        = true;
    existing.isSuspended     = false;
    existing.loginAttempts   = 0;
    existing.lockUntil       = undefined;
    if (userData.providerProfile) {
      existing.providerProfile = userData.providerProfile;
    }
    await existing.save();
    return 'updated';
  }

  await User.create({
    firstName:       userData.firstName,
    lastName:        userData.lastName,
    email:           userData.email,
    password:        userData.password,   // pre-save hook hashes it
    role:            userData.role,
    isEmailVerified: true,
    isActive:        true,
    agreeToTerms:    true,
    providerProfile: userData.providerProfile || undefined,
  });
  return 'created';
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const results = [];

    for (const userData of DEMO_USERS) {
      const action = await upsertUser(userData);
      results.push({ ...userData, action });
      const icon = action === 'created' ? '🆕' : '🔄';
      console.log(`${icon} ${action.toUpperCase().padEnd(8)} [${userData.role.toUpperCase().padEnd(8)}]  ${userData.email}`);
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    DEMO LOGIN CREDENTIALS                   ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    for (const u of results) {
      const roleLabel = u.role.toUpperCase().padEnd(8);
      console.log(`║  ${roleLabel}  Email    : ${u.email.padEnd(36)}║`);
      console.log(`║           Password : ${u.password.padEnd(36)}║`);
      console.log('║                                                              ║');
    }

    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  Login URL : http://localhost:3000/auth/login                ║');
    console.log('║                                                              ║');
    console.log('║  Tip: Open 3 different browsers (or incognito tabs) to test  ║');
    console.log('║  all 3 roles at the same time.                               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
