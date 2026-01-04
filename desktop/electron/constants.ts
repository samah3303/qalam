// Constants for the application
export const APP_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  
  // VAT/Tax
  DEFAULT_VAT_RATE: 5.0, // UAE VAT rate
  
  // Stock levels
  DEFAULT_LOW_STOCK_THRESHOLD: 10,
  
  // Dates
  DEFAULT_PAYMENT_TERMS_DAYS: 30,
  
  // Query limits
  MAX_SEARCH_RESULTS: 100,
  
  // API Timeouts (ms)
  IPC_TIMEOUT: 30000,
  
  // Validation
  MIN_PASSWORD_LENGTH: 6,
  MAX_CUSTOMER_NAME_LENGTH: 200,
  MAX_PRODUCT_NAME_LENGTH: 200,
  
  // Error messages (generic, not exposing internals)
  ERRORS: {
    GENERIC: 'An error occurred. Please try again.',
    NOT_FOUND: 'The requested item was not found.',
    VALIDATION: 'Please check your input and try again.',
    INSUFFICIENT_STOCK: 'Insufficient stock available.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
  }
} as const;

export type AppConstants = typeof APP_CONSTANTS;
