import { z } from 'zod';

// ─── Password Rules (reused across forms) ─────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/\d/,    'Must contain at least one number')
  .regex(/[@$!%*?&#^()_\-+=[\]{}|;:,.<>]/, 'Must contain at least one special character');

// ─── Register Schema ───────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),

    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^[+]?[\d\s\-().]{7,20}$/.test(val),
        { message: 'Please enter a valid phone number' }
      ),

    role: z.enum(['customer', 'provider'], {
      errorMap: () => ({ message: 'Please select a role' }),
    }),

    password: passwordSchema,

    confirmPassword: z.string().min(1, 'Please confirm your password'),

    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms and Conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

// ─── Login Schema ──────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z.string().min(1, 'Password is required'),
});

// ─── Forgot Password Schema ────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// ─── Reset Password Schema ─────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    password:        passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

// ─── Change Password Schema ────────────────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword:  z.string().min(1, 'Current password is required'),
    newPassword:      passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must differ from current password',
    path:    ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path:    ['confirmNewPassword'],
  });

// ─── Password Strength Helper ──────────────────────────────────────────────────
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password))    score++;
  if (/[@$!%*?&#^()_\-+=[\]{}|;:,.<>]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak',   color: '#e74c3c' };
  if (score <= 4) return { score, label: 'Fair',   color: '#f39c12' };
  if (score <= 5) return { score, label: 'Good',   color: '#2ecc71' };
  return           { score, label: 'Strong', color: '#27ae60' };
};
