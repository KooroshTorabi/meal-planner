/**
 * User-Friendly Error Messages
 * 
 * Provides clear, actionable error messages without exposing sensitive system details
 * Requirements: NFR-8
 */

/**
 * Error message templates
 */
export const ErrorMessages = {
  // Validation Errors (400)
  VALIDATION: {
    REQUIRED_FIELD: (field: string) =>
      `The ${field} field is required. Please provide a value and try again.`,
    INVALID_FORMAT: (field: string, format: string) =>
      `The ${field} field has an invalid format. Expected format: ${format}.`,
    INVALID_VALUE: (field: string, allowedValues: string[]) =>
      `The ${field} field has an invalid value. Allowed values are: ${allowedValues.join(', ')}.`,
    INVALID_DATE: (field: string) =>
      `The ${field} field must be a valid date in YYYY-MM-DD format.`,
    INVALID_EMAIL: () =>
      'Please provide a valid email address.',
    MISSING_OPTIONS: (mealType: string) =>
      `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} orders require ${mealType} options to be specified.`,
    INACTIVE_RESIDENT: () =>
      'Cannot create meal orders for inactive residents. Please activate the resident first or select a different resident.',
    EMPTY_FIELD: (field: string) =>
      `The ${field} field cannot be empty. Please provide a value.`,
  },

  // Authentication Errors (401)
  AUTHENTICATION: {
    INVALID_CREDENTIALS: () =>
      'The email or password you entered is incorrect. Please check your credentials and try again.',
    ACCOUNT_INACTIVE: () =>
      'Your account has been deactivated. Please contact an administrator for assistance.',
    TOKEN_EXPIRED: () =>
      'Your session has expired. Please log in again to continue.',
    TOKEN_INVALID: () =>
      'Your session is invalid. Please log in again.',
    TWO_FACTOR_REQUIRED: () =>
      'Two-factor authentication is required. Please enter your verification code.',
    TWO_FACTOR_INVALID: () =>
      'The verification code you entered is incorrect. Please try again.',
    MISSING_CREDENTIALS: () =>
      'Please provide both email and password to log in.',
  },

  // Authorization Errors (403)
  AUTHORIZATION: {
    INSUFFICIENT_PERMISSIONS: (action: string, resource: string) =>
      `You don't have permission to ${action} ${resource}. Please contact an administrator if you need access.`,
    ROLE_REQUIRED: (role: string) =>
      `This action requires ${role} role. Your current role does not have sufficient permissions.`,
    CANNOT_MODIFY_PREPARED: () =>
      'This meal order has already been prepared and cannot be modified. Please contact kitchen staff if changes are needed.',
    CANNOT_MODIFY_COMPLETED: () =>
      'This meal order has been completed and cannot be modified.',
    KITCHEN_ONLY: () =>
      'This action is only available to kitchen staff.',
    ADMIN_ONLY: () =>
      'This action is only available to administrators.',
    CAREGIVER_ONLY: () =>
      'This action is only available to caregivers.',
  },

  // Not Found Errors (404)
  NOT_FOUND: {
    RESOURCE: (resourceType: string) =>
      `The ${resourceType} you're looking for could not be found. It may have been deleted or moved.`,
    RESIDENT: () =>
      'The resident could not be found. Please check the resident ID and try again.',
    MEAL_ORDER: () =>
      'The meal order could not be found. It may have been deleted or archived.',
    USER: () =>
      'The user could not be found.',
    ALERT: () =>
      'The alert could not be found.',
    ARCHIVED_RECORD: () =>
      'The archived record could not be found.',
  },

  // Conflict Errors (409)
  CONFLICT: {
    DUPLICATE_ORDER: () =>
      'A meal order already exists for this resident, date, and meal type. Please edit the existing order instead of creating a new one.',
    VERSION_MISMATCH: () =>
      'This record has been modified by another user. Please refresh the page to see the latest version and try again.',
    CONCURRENT_EDIT: () =>
      'Another user is currently editing this record. Please wait a moment and try again, or contact the other user to coordinate changes.',
    DUPLICATE_EMAIL: () =>
      'An account with this email address already exists. Please use a different email or log in with the existing account.',
  },

  // Rate Limit Errors (429)
  RATE_LIMIT: {
    TOO_MANY_ATTEMPTS: (retryAfter?: number) => {
      if (retryAfter) {
        const minutes = Math.ceil(retryAfter / 60)
        return `Too many failed login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
      }
      return 'Too many failed login attempts. Please try again later.'
    },
    TOO_MANY_REQUESTS: () =>
      'You have made too many requests. Please wait a moment and try again.',
  },

  // Server Errors (500)
  SERVER: {
    INTERNAL_ERROR: () =>
      'An unexpected error occurred. Our team has been notified. Please try again in a few moments.',
    DATABASE_ERROR: () =>
      'We are experiencing database issues. Please try again in a few moments.',
    SERVICE_UNAVAILABLE: (service?: string) =>
      service
        ? `The ${service} service is currently unavailable. Some features may not work as expected.`
        : 'A service is currently unavailable. Some features may not work as expected.',
    CONFIGURATION_ERROR: () =>
      'There is a configuration issue. Please contact an administrator.',
  },

  // External Service Errors (503)
  EXTERNAL_SERVICE: {
    EMAIL_FAILED: () =>
      'We were unable to send the email notification. The action was completed, but you may not receive an email confirmation.',
    PUSH_NOTIFICATION_FAILED: () =>
      'We were unable to send the push notification. The action was completed, but you may not receive a notification on your device.',
    WEBSOCKET_FAILED: () =>
      'Real-time updates are currently unavailable. Please refresh the page to see the latest information.',
    ALERT_DELIVERY_FAILED: () =>
      'We were unable to deliver the alert through all channels. The alert has been created and is visible in the dashboard.',
  },

  // Database Errors
  DATABASE: {
    CONNECTION_FAILED: () =>
      'Unable to connect to the database. Please try again in a few moments.',
    QUERY_FAILED: (operation: string) =>
      `Unable to ${operation} data. Please try again.`,
    TRANSACTION_FAILED: () =>
      'The operation could not be completed. Please try again.',
  },

  // General Messages
  GENERAL: {
    TRY_AGAIN: () =>
      'Something went wrong. Please try again.',
    CONTACT_SUPPORT: () =>
      'If this problem persists, please contact support for assistance.',
    REFRESH_PAGE: () =>
      'Please refresh the page and try again.',
  },
}

/**
 * Get user-friendly error message based on error type and context
 */
export function getUserFriendlyMessage(
  errorType: string,
  context?: Record<string, any>
): string {
  // Validation errors
  if (errorType.includes('required') || errorType.includes('missing')) {
    const field = context?.field || 'field'
    return ErrorMessages.VALIDATION.REQUIRED_FIELD(field)
  }

  if (errorType.includes('invalid format')) {
    const field = context?.field || 'field'
    const format = context?.format || 'valid format'
    return ErrorMessages.VALIDATION.INVALID_FORMAT(field, format)
  }

  if (errorType.includes('invalid') && context?.allowedValues) {
    const field = context?.field || 'field'
    return ErrorMessages.VALIDATION.INVALID_VALUE(field, context.allowedValues)
  }

  // Authentication errors
  if (errorType.includes('credentials') || errorType.includes('password')) {
    return ErrorMessages.AUTHENTICATION.INVALID_CREDENTIALS()
  }

  if (errorType.includes('inactive') && errorType.includes('account')) {
    return ErrorMessages.AUTHENTICATION.ACCOUNT_INACTIVE()
  }

  if (errorType.includes('expired') && errorType.includes('token')) {
    return ErrorMessages.AUTHENTICATION.TOKEN_EXPIRED()
  }

  if (errorType.includes('2FA') || errorType.includes('two-factor')) {
    return ErrorMessages.AUTHENTICATION.TWO_FACTOR_INVALID()
  }

  // Authorization errors
  if (errorType.includes('permission') || errorType.includes('authorized')) {
    const action = context?.action || 'perform this action'
    const resource = context?.resource || 'this resource'
    return ErrorMessages.AUTHORIZATION.INSUFFICIENT_PERMISSIONS(action, resource)
  }

  if (errorType.includes('prepared') && errorType.includes('modify')) {
    return ErrorMessages.AUTHORIZATION.CANNOT_MODIFY_PREPARED()
  }

  // Not found errors
  if (errorType.includes('not found')) {
    const resourceType = context?.resourceType || 'resource'
    return ErrorMessages.NOT_FOUND.RESOURCE(resourceType)
  }

  // Conflict errors
  if (errorType.includes('already exists') || errorType.includes('duplicate')) {
    if (context?.collection === 'meal-orders') {
      return ErrorMessages.CONFLICT.DUPLICATE_ORDER()
    }
    if (context?.field === 'email') {
      return ErrorMessages.CONFLICT.DUPLICATE_EMAIL()
    }
    return ErrorMessages.CONFLICT.VERSION_MISMATCH()
  }

  if (errorType.includes('conflict') || errorType.includes('version')) {
    return ErrorMessages.CONFLICT.VERSION_MISMATCH()
  }

  // Rate limit errors
  if (errorType.includes('rate limit') || errorType.includes('too many')) {
    return ErrorMessages.RATE_LIMIT.TOO_MANY_ATTEMPTS(context?.retryAfter)
  }

  // Server errors
  if (errorType.includes('database')) {
    return ErrorMessages.SERVER.DATABASE_ERROR()
  }

  if (errorType.includes('service') || errorType.includes('unavailable')) {
    return ErrorMessages.SERVER.SERVICE_UNAVAILABLE(context?.service)
  }

  // Default message
  return ErrorMessages.SERVER.INTERNAL_ERROR()
}

/**
 * Add helpful suggestions to error messages
 */
export function addSuggestions(message: string, errorType: string): string {
  const suggestions: string[] = []

  // Add specific suggestions based on error type
  if (errorType.includes('credentials') || errorType.includes('password')) {
    suggestions.push('Make sure Caps Lock is off')
    suggestions.push('Check that you are using the correct email address')
  }

  if (errorType.includes('not found')) {
    suggestions.push('Verify the ID or name is correct')
    suggestions.push('The item may have been deleted or archived')
  }

  if (errorType.includes('permission') || errorType.includes('authorized')) {
    suggestions.push('Contact your administrator to request access')
    suggestions.push('Make sure you are logged in with the correct account')
  }

  if (errorType.includes('conflict') || errorType.includes('version')) {
    suggestions.push('Refresh the page to see the latest version')
    suggestions.push('Coordinate with other users to avoid conflicts')
  }

  if (suggestions.length > 0) {
    return `${message}\n\nSuggestions:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
  }

  return message
}
