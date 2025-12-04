/**
 * Error Handling Module
 * 
 * Centralized error handling, custom error types, and user-friendly messages
 * Requirements: NFR-2, NFR-5, NFR-8
 */

// Export error types
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
} from './types'

// Export error handler
export {
  handleError,
  parsePayloadError,
  withErrorHandler,
  isOperationalError,
} from './handler'

// Export error messages
export {
  ErrorMessages,
  getUserFriendlyMessage,
  addSuggestions,
} from './messages'
