const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived access token (15 min)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

/**
 * Generate a long-lived refresh token (7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Verify an access token; returns decoded payload or throws
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Send both tokens: access token in response body, refresh token in HttpOnly cookie
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // HttpOnly cookie options
  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Strip sensitive fields before sending user data
  const userData = {
    _id:             user._id,
    firstName:       user.firstName,
    lastName:        user.lastName,
    email:           user.email,
    role:            user.role,
    phone:           user.phone,
    avatar:          user.avatar,
    isEmailVerified: user.isEmailVerified,
    providerProfile: user.role === 'provider' ? user.providerProfile : undefined,
  };

  return res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    user: userData,
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sendTokenResponse,
};
