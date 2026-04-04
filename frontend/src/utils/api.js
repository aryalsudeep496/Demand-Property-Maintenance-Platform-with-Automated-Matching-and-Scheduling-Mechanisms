import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true, // Send cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor – Attach Access Token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor – Auto Refresh on 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;

        // ── Cross-tab session guard ─────────────────────────────────────────��
        // The refreshToken cookie is shared across all tabs for this origin.
        // If another tab logged in as a different user, the cookie gets
        // overwritten and the refresh would return THEIR token.
        // Detect this by comparing the token's embedded userId with the one
        // stored in sessionStorage (which IS per-tab).
        try {
          const payload      = JSON.parse(atob(newToken.split('.')[1]));
          const storedUserId = sessionStorage.getItem('userId');
          if (storedUserId && payload.id && storedUserId !== payload.id) {
            // Different user's token — clear this tab's session and re-login
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('userId');
            window.location.href = '/auth/login';
            return Promise.reject(new Error('Session conflict: please log in again.'));
          }
        } catch (_) { /* malformed token — let the backend reject it */ }
        // ────────────────────────────────────────────────────────────────────

        sessionStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('userId');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API Methods ──────────────────────────────────────────────────────────
export const authAPI = {
  register:           (data)  => api.post('/auth/register', data),
  login:              (data)  => api.post('/auth/login', data),
  logout:             ()      => api.post('/auth/logout'),
  verifyEmail:        (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword:     (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:      (token, data) => api.put(`/auth/reset-password/${token}`, data),
  changePassword:     (data)  => api.put('/auth/change-password', data),
  getMe:              ()      => api.get('/auth/me'),
  refreshToken:       ()      => api.post('/auth/refresh-token'),
};

export default api;
