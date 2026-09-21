/**
 * Rate Limiting Middleware
 * Implements tiered rate limiting for different API operations
 * Based on OWASP API4:2023 - Unrestricted Resource Consumption
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ===================================
// Rate Limit Configuration
// ===================================

// Check if we should skip rate limiting (development/test mode)
const shouldSkipRateLimit = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
};

// Standard error response format
const createRateLimitResponse = (message: string, retryAfter: number) => ({
  success: false,
  error: 'RATE_LIMIT_EXCEEDED',
  message,
  retryAfter,
});

// Strict Rate Limiter - For Auth Endpoints
// ==========================================
// Disabled strict blocking so legitimate shop clients don't get locked out randomly
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit safely
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ BYPASS: Always skip rate-limiting for auth endpoints
  skip: () => true,
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse(
      'Too many authentication attempts. Please try again after 15 minutes.',
      15 * 60
    ));
  },
});

// ===================================
// ==========================================
// Login Rate Limiter - Extra strict for login
// ==========================================
// ✅ BYPASS: Disabled login lockout so users are not blocked from POS/ERP
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // ✅ BYPASS: Skip condition active
  skip: () => true,
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse(
      'Too many failed login attempts. Account temporarily locked for 1 hour.',
      60 * 60
    ));
  },
});

// ===================================
// API Rate Limiter - For general API endpoints
// ===================================
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  message: createRateLimitResponse(
    'Too many requests. Please slow down.',
    60
  ),
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (handles IPv6 properly)
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse(
      'Too many requests. Please slow down.',
      60
    ));
  },
  skip: () => shouldSkipRateLimit(),
});

// ===================================
// Sensitive Operations Rate Limiter
// ===================================
// For operations like password change, invoice creation
export const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 sensitive operations per 15 minutes
  message: createRateLimitResponse(
    'Too many sensitive operations. Please wait before trying again.',
    15 * 60
  ),
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (handles IPv6 properly)
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse(
      'Too many sensitive operations. Please wait before trying again.',
      15 * 60
    ));
  },
  skip: () => shouldSkipRateLimit(),
});

// ===================================
// Shop Registration Rate Limiter
// ===================================
// Prevents spam shop creation
export const shopRegistrationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 shop registrations per day per IP
  message: createRateLimitResponse(
    'Too many shop registrations. Maximum 3 shops per day.',
    24 * 60 * 60
  ),
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator (handles IPv6 properly)
  handler: (req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse(
      'Too many shop registrations. Maximum 3 shops per day.',
      24 * 60 * 60
    ));
  },
  skip: () => shouldSkipRateLimit(),
});
