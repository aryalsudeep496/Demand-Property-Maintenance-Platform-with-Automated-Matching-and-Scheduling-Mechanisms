# 🏠 PropMaintain — Web-Based On-Demand Property Maintenance Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **MSc IT with Web Development — Final Year Project**
> University of the West of Scotland · Student: Sudeep Aryal · B01790919
> Supervisor: Md Shakil Ahmed

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Complete Setup Guide](#-complete-setup-guide)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Detailed Functionality Guide](#-detailed-functionality-guide)
  - [1. Authentication System](#1--authentication-system)
  - [2. Landing Page](#2--landing-page)
  - [3. Service Request Module](#3--service-request-module)
  - [4. Provider Profile & Availability](#4--provider-profile--availability)
  - [5. Notifications System](#5--notifications-system)
  - [6. Admin Dashboard](#6--admin-dashboard)
  - [7. Role-Based Access Control](#7--role-based-access-control)
  - [8. Security Features](#8--security-features)
- [Troubleshooting](#-troubleshooting)

---

## 🏗 About the Project

PropMaintain is a full-stack MERN web application that solves the problem of unorganised, manual property maintenance coordination. Property owners (customers) can post service requests, which are automatically matched to the best available verified professional (provider) based on their service category and availability.

The platform handles the entire job lifecycle — from initial booking, intelligent provider matching, automated scheduling when no provider is immediately available, real-time in-app communication between parties, transparent status tracking, through to job completion and review collection.

**Key research gap addressed:** Existing commercial home service platforms lack academically validated workflow automation, transparent coordination, and structured performance measurement. This project implements all three within a single integrated platform.

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | v20+ | Runtime environment |
| **Express.js** | 4.18 | REST API framework |
| **MongoDB Atlas** | Cloud | NoSQL database |
| **Mongoose** | 8.x | ODM for MongoDB |
| **jsonwebtoken** | 9.x | JWT access + refresh tokens |
| **bcryptjs** | 2.4 | Password hashing |
| **Nodemailer** | 6.9 | Email delivery |
| **express-validator** | 7.x | Input validation |
| **helmet** | 7.x | HTTP security headers |
| **cors** | 2.8 | Cross-origin requests |
| **express-rate-limit** | 7.x | Rate limiting |
| **morgan** | 1.10 | HTTP request logging |
| **cookie-parser** | 1.4 | Cookie handling |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI library |
| **React Router** | v6 | Client-side routing |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 3.x | Schema validation |
| **@hookform/resolvers** | 3.x | Zod + RHF bridge |
| **Axios** | 1.x | HTTP client |
| **Outfit** | Google Font | Primary typography |
| **Playfair Display** | Google Font | Display headings |

---

## 📁 Project Structure

```
PropMaintain/
├── backend/
│   ├── config/
│   │   └── db.js                        # MongoDB connection with reconnect logging
│   ├── controllers/
│   │   ├── authController.js            # register, login, verifyEmail, resendVerification,
│   │   │                                # forgotPassword, resetPassword, changePassword,
│   │   │                                # refreshToken, logout, getMe
│   │   ├── serviceRequestController.js  # createRequest, getMyRequests, getRequest,
│   │   │                                # updateStatus, sendMessage, submitReview,
│   │   │                                # getAvailableRequests, adminGetAllRequests
│   │   ├── userController.js            # getProfile, updateProfile, toggleAvailability,
│   │   │                                # adminGetProviders, adminVerifyProvider,
│   │   │                                # adminGetCustomers, adminToggleSuspend, adminGetStats
│   │   └── notificationController.js   # getNotifications, markAsRead
│   ├── middleware/
│   │   ├── authMiddleware.js            # protect (JWT verify), restrictTo(roles), optionalAuth
│   │   ├── validationMiddleware.js      # validateRegister, validateLogin,
│   │   │                                # validateForgotPassword, validateResetPassword,
│   │   │                                # validateChangePassword
│   │   └── errorMiddleware.js           # handleValidationErrors (formats field errors)
│   ├── models/
│   │   ├── User.js                      # Schema: firstName, lastName, email, phone (unique sparse),
│   │   │                                # password (select:false), role (customer/provider/admin),
│   │   │                                # isEmailVerified, isActive, isSuspended,
│   │   │                                # providerProfile (sub-schema), tokens, security tracking
│   │   ├── ServiceRequest.js            # Schema: customer, provider, category, serviceType,
│   │   │                                # title, description, urgency, location, status,
│   │   │                                # statusHistory, messages[], customerReview
│   │   └── Notification.js             # Schema: recipient, type, title, message, data, isRead
│   ├── routes/
│   │   ├── authRoutes.js               # All /api/auth/* with per-route rate limiters
│   │   ├── serviceRequestRoutes.js     # All /api/requests/* with validation chains
│   │   └── userRoutes.js               # All /api/users/* (profile + notifications + admin)
│   ├── utils/
│   │   ├── tokenUtils.js               # generateAccessToken, generateRefreshToken,
│   │   │                                # verifyAccessToken, verifyRefreshToken, sendTokenResponse
│   │   ├── emailUtils.js               # createTransporter, sendEmail, emailTemplates
│   │   │                                # (verifyEmail, resetPassword, welcomeEmail)
│   │   ├── matchingEngine.js           # findMatchingProviders, autoMatchProvider,
│   │   │                                # getNextAvailableSlot, SERVICE_TYPE_MAP
│   │   └── notificationUtils.js        # createNotification + all notify* helper functions
│   ├── .env                            # Environment secrets — NEVER commit
│   ├── .env.example                    # Safe template
│   ├── package.json
│   └── server.js                       # App entry: middleware, routes, error handlers
│
└── frontend/
    ├── public/
    │   └── index.html                   # Single HTML shell with <div id="root">
    └── src/
        ├── components/
        │   ├── auth/
        │   │   ├── AuthLayout.jsx       # Design 2: dark navbar + centered card
        │   │   │                        # Dark/light toggle stored in localStorage
        │   │   └── ProtectedRoute.jsx   # ProtectedRoute, RoleRoute, PublicOnlyRoute
        │   └── common/
        │       ├── FormInput.jsx        # Input with show/hide password + ARIA labels
        │       ├── PasswordStrengthMeter.jsx  # Live 6-segment strength + rules checklist
        │       └── StatusBadge.jsx      # StatusBadge, UrgencyBadge, CategoryBadge, StarRating
        ├── context/
        │   └── AuthContext.jsx          # useReducer: AUTH_LOADING, AUTH_SUCCESS, AUTH_ERROR,
        │                                # LOGOUT, UPDATE_USER, CLEAR_ERROR, SET_LOADING
        ├── pages/
        │   ├── LandingPage.jsx          # Animated hero, stats counter, services, testimonials
        │   ├── auth/
        │   │   ├── RegisterPage.jsx     # Role selector cards, inline server errors, success screen
        │   │   ├── LoginPage.jsx        # Email/password, unverified email detection
        │   │   ├── VerifyEmailPage.jsx  # Token verify, 5s countdown redirect, double-click fix
        │   │   ├── ForgotPasswordPage.jsx   # Email form, anti-enumeration response
        │   │   ├── ResetPasswordPage.jsx    # New password + strength meter, expired link handling
        │   │   ├── ChangePasswordPage.jsx   # Requires current password, signs out after
        │   │   └── ResendVerificationPage.jsx  # Resend with pre-filled email from state
        │   ├── dashboard/
        │   │   ├── CustomerDashboard.jsx    # Stats, recent requests, quick actions, notification badge
        │   │   └── ProviderDashboard.jsx    # Stats, availability toggle, recent jobs, notification badge
        │   ├── customer/
        │   │   ├── NewRequestPage.jsx       # 3-step form with per-step validation
        │   │   ├── CustomerRequestsPage.jsx # Filtered list, skeleton loading, pagination
        │   │   └── RequestDetailPage.jsx    # Detail + actions + chat + review form
        │   ├── provider/
        │   │   ├── ProviderProfilePage.jsx  # Skills tags, category cards, radius slider
        │   │   ├── ProviderJobsPage.jsx     # Assigned jobs with filter tabs
        │   │   └── AvailableJobsPage.jsx    # Open jobs matching provider's categories
        │   ├── admin/
        │   │   ├── AdminDashboard.jsx       # Platform stats + recent requests table
        │   │   ├── AdminUsersPage.jsx       # Providers/customers tabs, verify, suspend
        │   │   └── AdminRequestsPage.jsx    # All requests, status+category filters
        │   └── shared/
        │       └── NotificationsPage.jsx    # Works for all roles, mark read, navigate to request
        ├── utils/
        │   ├── api.js                   # Axios instance, request interceptor (attach JWT),
        │   │                            # response interceptor (silent token refresh on 401)
        │   ├── requestsAPI.js           # requestsAPI + usersAPI objects + CATEGORIES +
        │   │                            # STATUS_CONFIG + URGENCY_CONFIG constants
        │   └── validationSchemas.js     # Zod schemas: registerSchema, loginSchema,
        │                                # forgotPasswordSchema, resetPasswordSchema,
        │                                # changePasswordSchema + getPasswordStrength helper
        ├── App.jsx                      # All routes with ProtectedRoute + RoleRoute wrappers
        └── index.js                     # ReactDOM.createRoot entry point
```

---

## 📦 Prerequisites

Install these free tools before starting:

| Tool | Download | Version |
|------|----------|---------|
| **Node.js** | https://nodejs.org (download LTS) | v18+ |
| **VS Code** | https://code.visualstudio.com | Any |
| **Git** | https://git-scm.com/downloads | Any |

Verify:
```bash
node --version    # v18.x.x or higher
npm --version     # 9.x.x or higher
git --version     # git version 2.x.x
```

---

## 🚀 Complete Setup Guide

### Step 1 


Open **two terminals** in VS Code (`` Ctrl+` `` then click **+**):
- **Terminal 1** → for the backend
- **Terminal 2** → for the frontend

---

### Step 2 — MongoDB Atlas

The database is already set up. Every time you use a new computer or network:

1. Go to **https://cloud.mongodb.com** → sign in with Google (`aryalsudeep496@gmail.com`)
2. Left sidebar → **Network Access** → **Add IP Address**
3. Click **"Add Current IP Address"** → **Confirm**

> 💡 For university, home and laptop use: click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`) so you never need to update this again.

---

### Step 3 — Backend Setup

In **Terminal 1**:

```bash
cd backend
npm install
npm install cookie-parser
```

**Create `.env` file:**
```bash
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

> ⚠️ **Windows issue:** file may save as `.env.txt` — rename it in VS Code sidebar: right-click → Rename → delete `.txt`

**If `.env` still shows `undefined`**, recreate it using Node directly:
```bash
node -e "const fs=require('fs'); fs.writeFileSync('.env', 'PORT=5000\nNODE_ENV=development\nMONGO_URI=mongodb+srv://aryalsudeep496:Sudeep@cluster0.svgfhlv.mongodb.net/property_maintenance?retryWrites=true&w=majority&appName=Cluster0\nJWT_SECRET=PropMaintainSuperSecretJWTKey2024SecureKey\nJWT_EXPIRE=15m\nJWT_REFRESH_SECRET=PropMaintainRefreshTokenSecret2024Key\nJWT_REFRESH_EXPIRE=7d\nEMAIL_HOST=smtp.gmail.com\nEMAIL_PORT=587\nEMAIL_USER=aryalsudeep496@gmail.com\nEMAIL_PASS=your_app_password\nEMAIL_FROM=noreply@propmaintain.com\nCLIENT_URL=http://localhost:3000\nBCRYPT_SALT_ROUNDS=12\n'); console.log('done');"
```

**Verify `.env` is loading:**
```bash
node -e "require('dotenv').config(); console.log('MONGO_URI:', process.env.MONGO_URI)"
# Must print the full MongoDB URL — NOT "undefined"
```

---

### Step 4 — Gmail App Password

Required for email verification, password reset and welcome emails:

1. Go to **https://myaccount.google.com/security**
2. Ensure **2-Step Verification** is ON
3. Search **"App passwords"** → create one named `PropMaintain`
4. Copy the 16-character password (no spaces) into `.env` as `EMAIL_PASS`

> ℹ️ In `NODE_ENV=development`, accounts are auto-verified so you can test without email setup. Email is required for production.

---

### Step 5 — Frontend Setup

In **Terminal 2**:

```bash
cd frontend
npm install react-scripts
npm install
```

**Create `frontend/.env`** — right-click `frontend/` in VS Code sidebar → New File → `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**If `src/index.js` is missing**, create it:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
```

**If `public/index.html` is missing**, create `public/` folder then `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PropMaintain</title>
  </head>
  <body><div id="root"></div></body>
</html>
```

---

## 🌍 Environment Variables

Full `backend/.env` reference:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas — your actual connection string
MONGO_URI=mongodb+srv://aryalsudeep496:Sudeep@cluster0.svgfhlv.mongodb.net/property_maintenance?retryWrites=true&w=majority&appName=Cluster0

# JWT — keep these long and random (min 32 chars)
JWT_SECRET=PropMaintainSuperSecretJWTKey2024SecureKey
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=PropMaintainRefreshTokenSecret2024Key
JWT_REFRESH_EXPIRE=7d

# Gmail — App Password for email sending
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=aryalsudeep496@gmail.com
EMAIL_PASS=your_16_char_app_password_no_spaces
EMAIL_FROM=noreply@propmaintain.com

# Frontend URL (used in email links)
CLIENT_URL=http://localhost:3000

# Bcrypt salt rounds
BCRYPT_SALT_ROUNDS=12
```

> ⚠️ **Rules:** No quotes around values. No spaces around `=`. Always `.env` not `.env.txt`. Never commit to GitHub.

---

## ▶️ Running the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Expected output:
```
✅ MongoDB Connected: cluster0.svgfhlv.mongodb.net
🚀 Server running on port 5000 in development mode
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```
Browser opens automatically at **http://localhost:3000**

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | React app |
| Backend | http://localhost:5000 | Express API |
| Health check | http://localhost:5000/api/health | Verify API is running |

> ⚠️ Both terminals must remain open. Closing either one stops that part of the application.

---

## 📡 API Endpoints Reference

### Authentication — `/api/auth`

| Method | Endpoint | Access | Rate Limit | Description |
|--------|----------|--------|-----------|-------------|
| `POST` | `/register` | Public | 5/hr | Register new user, sends verification email |
| `POST` | `/login` | Public | 10/15min | Login, returns access token + refresh cookie |
| `GET` | `/verify-email/:token` | Public | — | Verify email with 24hr token |
| `POST` | `/resend-verification` | Public | — | Resend verification email |
| `POST` | `/forgot-password` | Public | 3/hr | Send password reset link (1hr expiry) |
| `PUT` | `/reset-password/:token` | Public | — | Set new password using reset token |
| `GET` | `/me` | Private | — | Get current authenticated user |
| `PUT` | `/change-password` | Private | — | Change password (requires current password) |
| `POST` | `/logout` | Private | — | Clear HttpOnly refresh token cookie |
| `POST` | `/refresh-token` | Public | — | Get new access token using refresh cookie |

### Service Requests — `/api/requests`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | Customer | Create request, auto-match or schedule |
| `GET` | `/my` | Auth | Own requests (customer) or assigned jobs (provider) |
| `GET` | `/available` | Provider | Open jobs matching provider's categories |
| `GET` | `/` | Admin | All requests with filters and pagination |
| `GET` | `/:id` | Auth | Full request detail + chat history |
| `PUT` | `/:id/status` | Auth | Update status (role-based transitions) |
| `POST` | `/:id/messages` | Auth | Send chat message (requires provider assigned) |
| `POST` | `/:id/review` | Customer | Submit 1–5 star rating after completion |

### Users & Admin — `/api/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/profile` | Auth | Get own full profile |
| `PUT` | `/profile` | Auth | Update profile details |
| `PUT` | `/availability` | Provider | Toggle available/unavailable |
| `GET` | `/notifications` | Auth | Paginated notifications, optional `?unreadOnly=true` |
| `PUT` | `/notifications/read` | Auth | Mark by IDs or `{ ids: 'all' }` |
| `GET` | `/admin/stats` | Admin | Platform-wide statistics |
| `GET` | `/admin/providers` | Admin | All providers with pagination |
| `PUT` | `/admin/providers/:id/verify` | Admin | Set `isVerified: true` |
| `GET` | `/admin/customers` | Admin | All customers with pagination |
| `PUT` | `/admin/users/:id/suspend` | Admin | Toggle `isSuspended` |

---

## 🧭 Detailed Functionality Guide

---

### 1 🔐 Authentication System

The authentication system manages the complete user lifecycle with multiple layers of security. It supports three distinct roles — **Customer**, **Provider**, and **Admin** — each with different permissions and dashboards.

#### Registration

When a user visits `/auth/register` they see a clean form split into sections:

**Role Selection:** Two card buttons at the top — "I need services" (Customer) and "I offer services" (Provider). The selected card highlights with an amber border. This determines what dashboard and features the user sees after login.

**Form Fields:**
- First Name and Last Name — side by side, letters only, 2–50 characters each
- Email Address — validated format, checked against database for duplicates
- Phone Number — optional, accepts any international format (e.g. `+44 7700 900000`), checked for duplicates
- Password — minimum 8 characters, must contain uppercase, lowercase, number and special character. A live 6-segment strength bar updates as the user types, showing which rules are met/unmet
- Confirm Password — must match the password field exactly
- Terms and Conditions checkbox — must be checked to submit

**Inline Server Errors:** If the user tries to register with an email that already exists, the error appears immediately under the email field in red — not as a generic top-level message. Same for phone numbers. This uses `setError()` from React Hook Form to target specific fields.

**On Success:** The form transitions to a success screen showing:
- 🎉 "Signup Successful!" heading
- ✅ "Your account has been created successfully" green banner
- 📧 Blue box explaining a verification link was sent to their specific email address
- Three numbered steps: Check inbox → Click link → Sign in
- "Go to Login Page →" button

#### Email Verification

After registration, the user receives an email with a unique verification link. The token is:
- Generated as 64 random bytes, stored as a SHA-256 hash in the database
- Valid for 24 hours
- Single-use — deleted after successful verification

**Gmail Prefetch Fix:** Gmail and Outlook automatically scan links in emails for security. This fires the verification endpoint once before the user even clicks. The system handles this with a 90-second window — if the token is already consumed but a user was verified within the last 90 seconds, the second request still returns success so the user never sees an error.

**Verification Page Flow:**
1. User clicks link → `/auth/verify-email/:token`
2. Page shows spinner "Verifying your email…"
3. On success: ✅ "Email Verified!" with a green progress bar
4. 5-second countdown then auto-redirects to `/auth/login`
5. "Go to Login Now →" button for immediate navigation

**After Verification:** A personalised welcome email is sent — "Hi [FirstName], Your account has been verified and you're all set as a [role]."

#### Login

The login page (`/auth/login`) uses the Design 2 AuthLayout: full-width dark navbar + centered white card on a warm background with dot grid pattern. A 🌙/☀️ toggle in the navbar switches between dark and light mode, persisted in `localStorage`.

**Login Validation:**
- Email must be valid format
- Password must not be empty
- All validation fires on submit with inline error messages

**Email Not Verified:** If the user tries to log in before verifying their email, they see a specific error message with a direct "Resend verification email →" link that pre-fills their email address on the resend page.

**Account Lockout:** After 5 consecutive failed login attempts, the account is locked for 30 minutes. The error message counts down remaining attempts: "Invalid email or password. 3 attempt(s) remaining before lockout."

**JWT Session Management:**
- Access token: 15-minute expiry, stored in `localStorage`
- Refresh token: 7-day expiry, stored in HttpOnly cookie (not accessible via JavaScript)
- When an API call returns 401 with `TOKEN_EXPIRED` code, Axios silently requests a new access token using the refresh cookie, then retries the original request — the user never notices

**Role-Based Redirect:** After login, the system routes to the appropriate dashboard:
- Customer → `/dashboard`
- Provider → `/provider/dashboard`
- Admin → `/admin/dashboard`

#### Forgot / Reset Password

**Forgot Password (`/auth/forgot-password`):**
- User enters their email address
- Server always returns the same success message regardless of whether the email exists (prevents email enumeration attacks)
- If the account exists: a reset link valid for 1 hour is emailed
- "Try a different email" button allows retrying without refreshing

**Reset Password (`/auth/reset-password/:token`):**
- The token is validated against the database
- If expired: shows "link has expired" message with a "Request a new link →" button
- If valid: shows new password + confirm password fields with strength meter
- On success: "Password reset successful" message, auto-redirects to login after 3 seconds

**Change Password (Authenticated — `/account/change-password`):**
- Requires the current password as verification
- New password must meet all strength requirements
- Cannot reuse the current password
- On success: signs the user out (all tokens cleared) — they must log in again with the new password

---

### 2 🌐 Landing Page

The landing page (`/home`) is a fully animated marketing page built without any CSS framework.

**Sections:**
1. **Navbar** — Sticky, transparent on load, solid dark navy on scroll with blur effect. Contains PropMaintain logo, nav links (Services, How It Works, Features, Testimonials), 🌙/☀️ theme toggle, Sign In and Get Started buttons
2. **Hero** — Large split layout. Left: animated "Your Home, *Perfectly* Maintained." heading with badge, description, two CTA buttons, social proof avatars + rating. Right: a floating mock UI card showing an active request with provider en-route, progress bar, and floating notification chips
3. **Stats Bar** — Animated counters that count up when scrolled into view (5,000+ jobs, 1,200+ providers, 98% satisfaction, 24/7 support)
4. **Services** — Three category cards with hover lift animations (Home Repair, Home Upgrade, Tech & Digital)
5. **How It Works** — Four numbered steps with hover slide effect
6. **Features** — Six feature cards in a 3-column grid
7. **Testimonials** — Three customer/provider review cards
8. **CTA Section** — "Your first booking is just minutes away" with Book/Join buttons
9. **Footer** — Copyright with university attribution

**Dark/Light Mode:** Two complete theme objects are defined with different colour palettes. Switching toggles instantly across all elements. The preference is stored in `localStorage` and applied on page load.

---

### 3 📋 Service Request Module

This is the core functionality — the complete lifecycle of a property maintenance job from booking to review.

#### Booking a Service (Customer)

The New Request page (`/customer/request/new`) guides customers through a 3-step form with a visual progress bar.

**Step 1 — Service Details:**
- **Category cards:** Three large clickable cards — 🔧 Home Repair, 🏡 Home Upgrade, 💻 Tech & Digital. The selected card shows an amber border and tinted background
- **Service Type dropdown:** Options change dynamically based on the selected category. Home Repair offers: Plumbing, Electrical, Carpentry, Roofing, Painting, General Repair, Other
- **Title field:** Minimum 5 characters, maximum 150. Character counter shows remaining
- **Description textarea:** Minimum 20 characters, maximum 2000. Encourages detail: "when it started, how bad it is, what you've already tried"
- **Urgency selector:** Four pill buttons — Low (green), Medium (amber), High (orange), Emergency (pink). Selected pill shows tinted background

**Step 2 — Location:**
- Street address (free text)
- City and Postcode (side by side) — postcode auto-uppercases
- Optional preferred date picker — minimum date is today
- Moving to Step 3 validates all location fields

**Step 3 — Review & Submit:**
- Full summary card showing all entered values
- Blue info box: "Once submitted, we will try to match you with an available provider immediately. If no provider is available, your request will be scheduled for the next available slot."
- Submit button calls the API
- On success: redirects to the request detail page passing a success message via router state

**Validation:** Each step validates only its own fields before allowing progression. Error messages appear in red under the specific failing field. You cannot skip steps.

#### Auto-Matching Engine

When a request is created, the backend immediately runs the matching algorithm:

1. Query the database for providers where:
   - `role = 'provider'`
   - `isActive = true`
   - `isEmailVerified = true`
   - `providerProfile.isAvailable = true`
   - `providerProfile.serviceCategories` contains the requested category
   - Not in the `rejectedProviders` array
2. Sort results by `averageRating` descending (best-rated first)
3. If a match is found: assign the provider, set status to `matched`
4. If no match: calculate the next weekday at 9:00am as `scheduledDate`, set status to `scheduled`

#### Status Lifecycle

Every request moves through a defined set of statuses:

```
pending ──────────────────────────────────────────┐
   │                                               │
   ▼ (auto-match found)          (no match found) │
matched                          scheduled         │
   │                                │              │
   │◄───────────────────────────────┘              │
   │                                               │
   ▼ (provider starts)                             │
in_progress                                        │
   │                                               │
   ▼ (provider completes)                          │
completed ──────────────────────────────────── cancelled
                                           (customer/provider/admin)
```

**Allowed transitions by role:**
- **Customer:** pending/matched/scheduled → cancelled
- **Provider:** matched/scheduled → in_progress → completed
- **Admin:** Any active state → cancelled or completed

Every status change is automatically logged to `statusHistory` with timestamp. This timeline is displayed on the request detail page.

#### Request Detail Page

The detail page (`/customer/requests/:id`) has a two-column layout:

**Left column (main content):**

*Request Details card:*
- Title with status badge
- Category, urgency, and date badges
- Full description text
- Info grid: address, service type, preferred date, scheduled date (if applicable), completed date (if applicable), cancel reason (if cancelled)

*Actions card (contextual — only shows relevant buttons):*
- Provider sees "🔧 Start Job" when status is matched/scheduled
- Provider sees "✅ Mark as Complete" when in_progress
- Customer sees "❌ Cancel Request" when status is pending/matched/scheduled
- Buttons disabled during loading, amber/green/red coloured appropriately

*Chat card:*
- 300px scrollable message area with auto-scroll to latest message
- Messages are right-aligned (mine, dark navy background) or left-aligned (theirs, white with border)
- Each message shows sender name and time
- Disabled with helpful message if no provider assigned yet
- Enter key sends message, disabled after completion/cancellation

*Review card (only shows when completed and not yet reviewed):*
- "Rate this Service" button expands the review form
- Five clickable star buttons with animation and label (Poor/Fair/Good/Great/Excellent)
- Optional comment textarea (max 1000 chars)
- Submit/Cancel buttons
- After submission: shows the submitted review with stars

**Right column (sidebar):**

*Assigned Provider card:*
- Provider's initials avatar (dark navy circle)
- Full name, email
- Star rating, total reviews, bio excerpt
- If unassigned: shows scheduled date or "Searching for provider…"

*Status History card:*
- Timeline of all status changes, newest at top
- Current status has amber dot, older ones have grey dots
- Each entry shows status label, exact datetime, and optional note

*Customer card (visible to provider only):*
- Customer's initials avatar (amber circle)
- Full name, email, phone

#### My Requests List (Customer)

The requests list page (`/customer/requests`) shows all the customer's requests with filtering:

**Filter tabs:** All, Pending, Matched, Scheduled, In Progress, Completed, Cancelled — clicking any tab resets to page 1 and fetches filtered results

**Request cards (clickable rows):** Each card shows:
- Category icon (🔧/🏡/💻) in a rounded square
- Title (truncated if too long)
- Status badge (right-aligned)
- Category + Urgency badges on second row
- City, creation date, assigned provider name, message count at the bottom
- Hover: card lifts with stronger shadow

**Pagination:** Previous / numbered pages / Next buttons appear when there are multiple pages (8 results per page)

**Empty state:** Different messages for "no requests at all" vs "none matching this filter", both with a "Book a Service" button

**Skeleton loading:** Three animated placeholder boxes shown while data loads

---

### 4 👷 Provider Profile & Availability

Providers have their own dedicated section of the platform for managing how they appear to customers and what jobs they take on.

#### Provider Dashboard

The provider dashboard (`/provider/dashboard`) is the central hub:

**Stats row:** Total Jobs, Active, Completed, Average Rating — all fetched from the API and animated on load

**Availability toggle:** Large prominent button at the top right. Green "Available" state means the provider appears in the matching pool. Red "Unavailable" removes them from all new matching queries. The state persists in the database — it survives page refreshes and logouts

**Quick action cards:** "Browse Available Jobs" (dark green) and "Update Profile" side by side

**Recent jobs list:** Last 5 assigned jobs with title, location, date and status badge — each linking to the job detail page

#### Profile Management (`/provider/profile`)

The profile page allows providers to set up their professional identity:

**Personal details:** First Name, Last Name, Phone, Business Name — all editable text inputs

**Bio:** Textarea limited to 500 characters with counter. Shown on the request detail page to customers

**Service Categories:** Three toggle cards (Home Repair, Home Upgrade, Tech & Digital). Multiple can be selected. Only selected categories will receive matching requests

**Skills Tags:** A text input where the provider types a skill (e.g. "Boiler repair") and presses Enter to add it as a pill tag. Each tag has a × button to remove. Skills are stored as a string array in the database

**Availability Radius:** A range slider from 1–100km. Intended for future geo-based matching — sets how far the provider is willing to travel

**Verification Status Badge:** Shows "Pending Verification" (amber) or "Verified ✅" (green) depending on whether an admin has verified the account

**Save button:** Calls `PUT /api/users/profile`, shows success/error message

#### Available Jobs (`/provider/available`)

Lists all open requests that match the provider's service categories:

**Cards show:** Title, category, urgency badge, city/postcode, description preview (2 lines), date posted

**"View & Accept" button:** Navigates to the full request detail page where the provider can read the full description, see the customer's location, and use the action buttons

**Refresh button:** Manually reloads the job list (no auto-poll)

**Empty state:** If no matching jobs exist, shows a helpful message suggesting the provider checks their profile has categories set and availability is turned on

#### My Jobs (`/provider/requests`)

Identical layout to the customer's request list but shows jobs assigned to the provider. Same filter tabs, pagination and skeleton loading. Each card links to `/provider/requests/:id` which renders the same `RequestDetailPage` but with provider-specific action buttons (Start Job, Mark Complete).

---

### 5 🔔 Notifications System

The notifications system keeps all users informed of important events without requiring them to manually check the platform.

#### What Triggers a Notification

Every key event in the service lifecycle creates a notification for the relevant party:

| Event | Recipient | Message |
|-------|-----------|---------|
| Customer creates a request | Customer | "Your request '[title]' has been submitted and we're finding a provider." |
| Provider is auto-matched | Customer | "[Provider Name] has been matched to your request '[title]'." |
| Request scheduled (no provider) | Customer | "Your service has been scheduled for [date]." |
| Provider starts the job | Customer | "Your '[title]' service is now in progress." |
| Job marked complete | Customer + Provider | Customer: "Please leave a review." Provider: "Check your earnings." |
| New chat message | The other party | "[Sender Name] sent you a message." |
| Request cancelled | Both parties | "[Title] was cancelled by [role]." |

All notifications are created asynchronously — they never block the main request flow. If notification creation fails, it is logged but does not affect the response.

#### Notification Bell (Navbar)

The notification bell icon in every navbar (customer and provider dashboards, all inner pages) shows an unread count badge:

- Badge is red with white text
- Shows the count of unread notifications
- If more than 9: shows "9+" 
- Disappears entirely when count is 0
- Count is fetched once on component mount (`GET /api/users/notifications?unreadOnly=true&limit=1`)

#### Notifications Page (`/customer/notifications` or `/provider/notifications`)

The same `NotificationsPage` component serves both roles:

**Layout:**
- "Mark all as read" button at the top right (only visible if there are unread notifications)
- Notifications listed newest first
- Unread notifications: light blue background + 4px solid blue left border
- Read notifications: white background + no border

**Each notification card shows:**
- Type icon (different emoji per notification type)
- Title in bold
- Message text
- Time ago (e.g. "2 hours ago", "3 days ago")
- Unread dot indicator on the right (disappears when read)

**Click behaviour:**
1. Marks the notification as read (calls `PUT /api/users/notifications/read` with the ID)
2. If `data.requestId` exists in the notification: navigates to the relevant request page
3. If no request ID: just marks as read and stays on the page

**Mark All as Read:** Single button at the top sends `{ ids: 'all' }` to the API, refreshes the list

**Empty state:** Bell emoji with "You're all caught up! No notifications yet."

---

### 6 🛡 Admin Dashboard

The admin role has full visibility and control over the entire platform. There is no admin registration — admin accounts are created directly in MongoDB Atlas by changing a user's `role` field to `admin`.

#### How to Create an Admin

1. Register a normal account at `/auth/register`
2. Go to **https://cloud.mongodb.com** → Browse Collections → `property_maintenance` → `users`
3. Find the user document, click Edit, change `"role": "customer"` to `"role": "admin"`
4. Click Update
5. Log in — you'll be redirected to `/admin/dashboard`

#### Admin Dashboard (`/admin/dashboard`)

**Stats row (6 cards):**
- Total Users — all accounts in the system
- Total Providers — users with role: provider
- Total Customers — users with role: customer
- Total Requests — all service requests ever created
- Completed — requests with status: completed
- Active — requests with status: pending, matched, scheduled, or in_progress

All stats are fetched from `GET /api/users/admin/stats` which runs 6 parallel count queries using `Promise.all`.

**Recent Requests table:**
- Last 20 requests ordered by creation date
- Columns: Title, Customer, Provider (or "Unassigned"), Category badge, Status badge, Date
- Each row is a link to the request detail page
- Pagination for navigating beyond 20

#### Admin Users Page (`/admin/users`)

Two tabs at the top: **Providers** | **Customers**

**Providers tab:**
- Table: Name, Email, Service Categories (badges), Verification Status, Suspended Status, Actions
- **Verify button** (shows only if not yet verified): calls `PUT /api/users/admin/providers/:id/verify` → changes badge from "Pending" to "Verified ✅"
- **Suspend/Unsuspend button**: calls `PUT /api/users/admin/users/:id/suspend` → suspended accounts cannot log in

**Customers tab:**
- Table: Name, Email, Registration Date, Suspended Status, Actions
- **Suspend/Unsuspend button** for each customer

All changes take effect immediately — the button updates the UI optimistically and refreshes the data.

#### Admin Requests Page (`/admin/requests`)

**Filters:**
- Status dropdown: All, Pending, Matched, Scheduled, In Progress, Completed, Cancelled
- Category dropdown: All, Home Repair, Home Upgrade, Tech & Digital
- Filters can be combined

**Table columns:** Title, Customer, Provider (or Unassigned), Category badge, Status badge, Urgency badge, Created date, View link

**Pagination:** 20 requests per page with Prev/Next and page number buttons

---

### 7 🔑 Role-Based Access Control

The application implements strict role-based routing on both the backend and frontend.

#### Backend (Middleware)

`protect` middleware:
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies signature and expiry
3. Fetches the user from database
4. Checks `isActive` and `isSuspended` flags
5. Checks if password was changed after the token was issued
6. Attaches `req.user` for downstream use

`restrictTo(...roles)` middleware:
- Called after `protect`
- Checks `req.user.role` against the allowed roles array
- Returns 403 if not permitted

#### Frontend (Route Guards)

`ProtectedRoute`: Redirects unauthenticated users to `/auth/login`, passing the intended destination in router state so they can return after logging in.

`RoleRoute`: After authentication, checks the user's role. If the role doesn't match, redirects to the user's own dashboard (not a 403 page — prevents confusion).

`PublicOnlyRoute`: Redirects already-authenticated users away from login/register to their dashboard.

---

### 8 🔒 Security Features

**Password Security:**
- bcrypt hashing with 12 salt rounds — computationally expensive to brute-force
- Password change tracking via `passwordChangedAt` — any JWT issued before a password change is automatically invalidated

**Token Security:**
- Access token: short-lived (15 min), stored in `localStorage`
- Refresh token: long-lived (7 days), stored in `HttpOnly` cookie — inaccessible to JavaScript, protected against XSS
- Token rotation: refresh token is renewed on each use

**Rate Limiting:**
- Login: 10 attempts per 15 minutes per IP
- Register: 5 attempts per hour per IP
- Forgot Password: 3 attempts per hour per IP

**Account Lockout:**
- 5 consecutive failed login attempts locks the account for 30 minutes
- Lockout is stored in the database, not in memory — survives server restarts

**Input Validation:**
- All inputs validated server-side with `express-validator` before reaching controllers
- Field-level errors returned as `{ fieldName: "error message" }` objects for inline display
- Email normalised and lowercased on every save

**Anti-Enumeration:**
- Forgot password always returns identical response whether email exists or not
- Resend verification always returns identical response whether email exists or not

**HTTP Security:**
- `helmet` sets secure HTTP headers (X-Frame-Options, Content-Security-Policy, etc.)
- CORS configured to only accept requests from `CLIENT_URL`
- Request body limited to 10kb to prevent large payload attacks

---

## 🔧 Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| `Cannot find module 'cookie-parser'` | Not installed | `npm install cookie-parser` |
| `MONGO_URI: undefined` | `.env.txt` not `.env`, or wrong folder | Rename file, verify it's in `backend/` |
| `MongoDB connection failed` | Wrong password or IP not whitelisted | Check Atlas Network Access, verify password |
| `535 Gmail error` | Wrong App Password | Generate new at myaccount.google.com |
| `Port 5000 in use` | Another process running | Change `PORT=5001` in `.env` |
| `Could not find index.js` | File missing | Create `src/index.js` as shown in setup |
| `CORS error in browser` | Wrong CLIENT_URL | Set `CLIENT_URL=http://localhost:3000` in `.env` |
| `400 on register` | Weak password | Use: uppercase + lowercase + number + special char |
| `401 after login` | User not email-verified | Delete user in Atlas, re-register |
| `Blank white page` | React still compiling | Wait 30s then `Ctrl+Shift+R` |
| `curl fails in PowerShell` | Windows syntax difference | Use browser F12 Console with `fetch()` instead |

**Golden rule:** Always check the **backend terminal** first — every request is logged with emoji indicators (✅ success, ❌ error, 📧 email sent, 🔍 token verify).

---

## 👨‍💻 Author

**Sudeep Aryal**
Banner ID: B01790919 · MSc IT with Web Development
University of the West of Scotland · Supervisor: Md Shakil Ahmed · 2025–2026

---

## 📄 License

Submitted as part of an MSc dissertation at the University of the West of Scotland. All rights reserved.
