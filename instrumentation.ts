/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 * Used to initialize services
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server-side
    const { initializeServices } = await import('./lib/startup-services')
    
    // Initialize services asynchronously (don't block startup)
    initializeServices().catch((error) => {
      console.error('Failed to initialize services:', error)
      // Don't throw - allow app to start even if services fail
    })
  }
}

