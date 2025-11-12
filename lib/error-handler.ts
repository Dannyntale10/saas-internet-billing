import { NextRequest, NextResponse } from 'next/server'
import { logger, logError } from './logger'
import { recordError } from './monitoring'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, request?: NextRequest): NextResponse {
  // Log the error
  if (error instanceof AppError) {
    logError(error, {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
      path: request?.url,
      method: request?.method,
    })
    recordError(error.message)

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    logError(error, {
      path: request?.url,
      method: request?.method,
    })
    recordError(error.message)

    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'production' 
          ? 'An internal server error occurred' 
          : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: 500 }
    )
  }

  // Unknown error
  const unknownError = new Error('Unknown error occurred')
  logError(unknownError, {
    path: request?.url,
    method: request?.method,
    originalError: error,
  })
  recordError('Unknown error')

  return NextResponse.json(
    {
      error: 'An internal server error occurred',
    },
    { status: 500 }
  )
}

// Error boundary for API routes
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      return handleError(error, request)
    }
  }
}

