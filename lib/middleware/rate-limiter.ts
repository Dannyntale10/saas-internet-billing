import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options

  return (request: NextRequest): NextResponse | null => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown'

    const now = Date.now()
    const record = requestCounts.get(ip)

    // Clean up old records
    if (requestCounts.size > 10000) {
      const cutoff = now - windowMs
      for (const [key, value] of requestCounts.entries()) {
        if (value.resetTime < cutoff) {
          requestCounts.delete(key)
        }
      }
    }

    if (!record || now > record.resetTime) {
      // New window
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      })
      return null // Allow request
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          },
        }
      )
    }

    // Increment count
    record.count++
    return null // Allow request
  }
}

// Predefined rate limiters
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again later.',
})

export const paymentRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts. Please try again later.',
})

