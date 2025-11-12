/**
 * Client middleware - now uses unified authentication
 * This file is kept for backward compatibility
 */
import { NextRequest } from 'next/server'
import { verifyClient } from './middleware'

export { verifyClient }
