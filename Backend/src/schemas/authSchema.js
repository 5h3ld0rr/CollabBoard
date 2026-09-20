import { z } from 'zod';

/**
 * Validation schema for User Registration
 */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional().default('User'),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

/**
 * Validation schema for User Login
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Validation schema for Updating User Profile
 */
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address').optional(),
  color: z.string().optional(),
  subscriptionPlan: z.enum(['basic', 'pro']).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
});

/**
 * Validation schema for Updating Password
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});
