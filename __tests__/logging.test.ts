/**
 * Logging System Tests
 * 
 * Tests the structured logging system
 * Requirements: NFR-5
 */

import {
  logDebug,
  logInfo,
  logWarn,
  logError,
  logSecurityEvent,
  logPerformance,
  startTimer,
  logDatabaseQuery,
  logApiRequest,
  logAuthAttempt,
  logAuthorizationFailure,
  logDataModification,
  PerformanceTimer,
} from '@/lib/logging'
import { ValidationError, InternalServerError } from '@/lib/errors'

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleDebug = console.debug

describe('Logging System', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('Basic Logging Functions', () => {
    test('logInfo should log info messages', () => {
      logInfo('Test info message', { key: 'value' }, 'req_123')

      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('info')
      expect(loggedData.message).toBe('Test info message')
      expect(loggedData.context).toEqual({ key: 'value' })
      expect(loggedData.requestId).toBe('req_123')
      expect(loggedData.timestamp).toBeDefined()
    })

    test('logWarn should log warning messages', () => {
      logWarn('Test warning message')

      expect(consoleWarnSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('warn')
      expect(loggedData.message).toBe('Test warning message')
    })

    test('logDebug should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logDebug('Test debug message')

      expect(consoleDebugSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleDebugSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('debug')
      expect(loggedData.message).toBe('Test debug message')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error Logging', () => {
    test('logError should log AppError with full context', async () => {
      const error = new ValidationError('Invalid input', 'email', undefined, {
        userId: '123',
      })

      await logError(error, 'req_456', { operation: 'create' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('error')
      expect(loggedData.message).toBe('Invalid input')
      expect(loggedData.requestId).toBe('req_456')
      expect(loggedData.error).toBeDefined()
      expect(loggedData.error.name).toBe('Error') // Error name is 'Error' due to how Error.name works
      expect(loggedData.error.statusCode).toBe(400)
      expect(loggedData.error.isOperational).toBe(true)
    })

    test('logError should log regular Error', async () => {
      const error = new Error('Regular error')

      await logError(error, 'req_789')

      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('error')
      expect(loggedData.message).toBe('Regular error')
      expect(loggedData.error).toBeDefined()
      expect(loggedData.error.name).toBe('Error')
    })

    test('logError should log critical errors for non-operational errors', async () => {
      const error = new InternalServerError('Critical error')

      await logError(error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2) // Once for log, once for critical
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      
      expect(loggedData.error.isOperational).toBe(false)
    })
  })

  describe('Security Event Logging', () => {
    test('logSecurityEvent should log security events', () => {
      logSecurityEvent(
        'Login Attempt',
        {
          userId: '123',
          email: 'test@example.com',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          success: true,
        },
        'req_sec_123'
      )

      // Security events are logged to console.error
      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('security')
      expect(loggedData.message).toContain('Security Event')
      expect(loggedData.security).toBeDefined()
      expect(loggedData.security.event).toBe('Login Attempt')
      expect(loggedData.security.userId).toBe('123')
      expect(loggedData.security.ip).toBe('192.168.1.1')
    })
  })

  describe('Performance Logging', () => {
    test('logPerformance should log performance metrics', () => {
      logPerformance('Database Query', 150, { collection: 'meal-orders' }, 'req_perf_123')

      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('performance')
      expect(loggedData.message).toContain('Database Query')
      expect(loggedData.message).toContain('150ms')
      expect(loggedData.performance).toBeDefined()
      expect(loggedData.performance.duration).toBe(150)
      expect(loggedData.performance.operation).toBe('Database Query')
    })

    test('logPerformance should warn for slow operations', () => {
      logPerformance('Slow Operation', 3000)

      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
      
      const warnData = JSON.parse(consoleWarnSpy.mock.calls[0][0])
      expect(warnData.message).toContain('Slow operation detected')
    })
  })

  describe('Performance Timer', () => {
    test('PerformanceTimer should track elapsed time', () => {
      const timer = new PerformanceTimer('Test Operation')
      
      // Simulate some work
      const start = Date.now()
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const elapsed = timer.elapsed()
      expect(elapsed).toBeGreaterThanOrEqual(10)
    })

    test('PerformanceTimer.end should log performance', () => {
      const timer = new PerformanceTimer('Test Operation')
      
      const duration = timer.end()
      
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(consoleLogSpy).toHaveBeenCalled()
      
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(loggedData.level).toBe('performance')
      expect(loggedData.performance.operation).toBe('Test Operation')
    })

    test('startTimer should create PerformanceTimer', () => {
      const timer = startTimer('Test Operation', { key: 'value' }, 'req_timer_123')
      
      expect(timer).toBeInstanceOf(PerformanceTimer)
      
      timer.end()
      
      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(loggedData.context).toEqual({ key: 'value' })
      expect(loggedData.requestId).toBe('req_timer_123')
    })
  })

  describe('Specialized Logging Functions', () => {
    test('logDatabaseQuery should log database operations', () => {
      logDatabaseQuery('meal-orders', 'find', 250, { limit: 50 }, 'req_db_123')

      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('performance')
      expect(loggedData.message).toContain('Database find on meal-orders')
      expect(loggedData.context.collection).toBe('meal-orders')
      expect(loggedData.context.operation).toBe('find')
    })

    test('logApiRequest should log API requests', () => {
      logApiRequest('POST', '/api/meal-orders', 201, 150, { userId: '123' }, 'req_api_123')

      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('info')
      expect(loggedData.message).toContain('POST')
      expect(loggedData.message).toContain('/api/meal-orders')
      expect(loggedData.message).toContain('201')
      expect(loggedData.context.method).toBe('POST')
      expect(loggedData.context.statusCode).toBe(201)
    })

    test('logApiRequest should use error level for 5xx status codes', () => {
      logApiRequest('GET', '/api/meal-orders', 500, 100)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(loggedData.level).toBe('error')
    })

    test('logApiRequest should use warn level for 4xx status codes', () => {
      logApiRequest('GET', '/api/meal-orders', 404, 50)

      expect(consoleWarnSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0])
      expect(loggedData.level).toBe('warn')
    })

    test('logAuthAttempt should log authentication attempts', () => {
      logAuthAttempt('test@example.com', true, '192.168.1.1', 'Mozilla/5.0', undefined, 'req_auth_123')

      // Security events are logged to console.error
      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('security')
      expect(loggedData.message).toContain('Login Success')
      expect(loggedData.context.email).toBe('test@example.com')
      expect(loggedData.context.success).toBe(true)
    })

    test('logAuthorizationFailure should log authorization failures', () => {
      logAuthorizationFailure('user_123', 'residents', 'delete', 'Insufficient permissions', 'req_authz_123')

      // Security events are logged to console.error
      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('security')
      expect(loggedData.message).toContain('Authorization Failed')
      expect(loggedData.context.userId).toBe('user_123')
      expect(loggedData.context.success).toBe(false)
    })

    test('logDataModification should log data changes', () => {
      logDataModification('meal-orders', 'order_123', 'update', 'user_456', { field: 'status' }, 'req_data_123')

      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBe('info')
      expect(loggedData.message).toContain('Data update')
      expect(loggedData.context.collection).toBe('meal-orders')
      expect(loggedData.context.documentId).toBe('order_123')
      expect(loggedData.context.operation).toBe('update')
      expect(loggedData.context.userId).toBe('user_456')
    })
  })

  describe('Log Format', () => {
    test('logs should be valid JSON', () => {
      logInfo('Test message')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logString = consoleLogSpy.mock.calls[0][0]
      
      expect(() => JSON.parse(logString)).not.toThrow()
    })

    test('logs should include timestamp', () => {
      logInfo('Test message')

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.timestamp).toBeDefined()
      expect(new Date(loggedData.timestamp).getTime()).toBeGreaterThan(0)
    })

    test('logs should include level', () => {
      logInfo('Test message')

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      
      expect(loggedData.level).toBeDefined()
      expect(['debug', 'info', 'warn', 'error', 'security', 'performance']).toContain(loggedData.level)
    })
  })
})
