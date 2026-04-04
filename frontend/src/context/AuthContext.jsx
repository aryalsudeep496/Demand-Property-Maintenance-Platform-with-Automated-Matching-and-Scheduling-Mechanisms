import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

// ─── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  user:            null,
  accessToken:     sessionStorage.getItem('accessToken') || null,
  isLoading:       true,
  isAuthenticated: false,
  error:           null,
};

// ─── Reducer ───────────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading:       false,
        isAuthenticated: true,
        user:            action.payload.user,
        accessToken:     action.payload.accessToken,
        error:           null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading:       false,
        isAuthenticated: false,
        user:            null,
        accessToken:     null,
        error:           action.payload,
      };

    case 'LOGOUT':
      return { ...initialState, isLoading: false, accessToken: null };

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
};

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Bootstrap: verify stored token on app load ────────────────────────────
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.data, accessToken: token },
        });
      } catch {
        sessionStorage.removeItem('accessToken');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    bootstrapAuth();
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
  try {
    const { data } = await authAPI.register(formData);
    return { success: true, data: data.data, message: data.message };
  } catch (error) {
    const msg    = error.response?.data?.message || 'Registration failed.';
    const errors = error.response?.data?.errors  || {};
    return { success: false, message: msg, errors };
  }
}, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { data } = await authAPI.login(credentials);
      sessionStorage.setItem('accessToken', data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
      return { success: true, user: data.user };
    } catch (error) {
      const msg     = error.response?.data?.message || 'Login failed.';
      const code    = error.response?.data?.code;
      const errData = error.response?.data?.data;
      dispatch({ type: 'AUTH_ERROR', payload: msg });
      return { success: false, message: msg, code, data: errData };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Always clear local state even if API call fails
    } finally {
      sessionStorage.removeItem('accessToken');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // ── Forgot Password ───────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    try {
      const { data } = await authAPI.forgotPassword(email);
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed.',
      };
    }
  }, []);

  // ── Reset Password ────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (token, formData) => {
    try {
      const { data } = await authAPI.resetPassword(token, formData);
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Reset failed.',
        errors:  error.response?.data?.errors || {},
      };
    }
  }, []);

  // ── Update user (after profile edit) ─────────────────────────────────────
  const updateUser = useCallback((userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
