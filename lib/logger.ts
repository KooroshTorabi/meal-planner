// Simple environment-aware logger
// Shows debug/info logs only in development; warns/errors always print

type LogFn = (...args: unknown[]) => void

const makeLogger = () => {
  // Check if we're in development mode dynamically
  const isDev = () => {
    // If NODE_ENV is not set or is 'development', show logs
    // This handles both explicit development and npm run dev cases
    const env = process.env.NODE_ENV
    return !env || env === 'development'
  }

  const log: LogFn = (...args) => {
    if (isDev()) console.log(...args)
  }

  const debug: LogFn = (...args) => {
    if (isDev()) console.debug(...args)
  }

  const info: LogFn = (...args) => {
    if (isDev()) {
      console.info ? console.info(...args) : console.log(...args)
    } else if (process.env.LOG_LEVEL === 'info') {
      console.info ? console.info(...args) : console.log(...args)
    }
  }

  const warn: LogFn = (...args) => console.warn(...args)
  const error: LogFn = (...args) => console.error(...args)

  return { log, debug, info, warn, error }
}

export const logger = makeLogger()
