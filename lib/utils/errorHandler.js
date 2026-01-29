/**
 * Sanitize error messages for production
 * Hides sensitive technical details from users
 */
export function getUserFriendlyError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  // In development, show more details
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!error) {
    return fallbackMessage;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return isDevelopment ? error : fallbackMessage;
  }

  // Common user-friendly error mappings
  const errorMappings = {
    // Authentication errors
    'Unauthorized': 'Please log in to continue',
    'Invalid credentials': 'Invalid email or password',
    'User not found': 'Account not found',
    'Email already exists': 'An account with this email already exists',
    'Session expired': 'Your session has expired. Please log in again',
    
    // Network errors
    'Network error': 'Network connection error. Please check your internet',
    'Failed to fetch': 'Connection error. Please check your internet',
    'ECONNREFUSED': 'Unable to connect to server',
    
    // Validation errors
    'Validation failed': 'Please check your input and try again',
    'Cast to ObjectId failed': 'Invalid ID format',
    'Room not found': 'Room no longer exists',
    'Room ID is required': 'Please enter a room ID',
    
    // File upload errors
    'File too large': 'File size exceeds maximum limit',
    'Invalid file type': 'File type not supported',
    'No file uploaded': 'Please select a file to upload',
  };

  // Get error message
  let errorMessage = error.message || error.error || String(error);

  // Check for mapped errors
  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Handle MongoDB errors
  if (errorMessage.includes('duplicate key')) {
    return 'This record already exists';
  }

  if (errorMessage.includes('validation')) {
    return 'Please check your input and try again';
  }

  // In production, return generic message for unmapped errors
  if (!isDevelopment) {
    // Only return error message if it's user-safe (no technical jargon)
    const technicalKeywords = [
      'Error:',
      'at ',
      'module',
      'file:',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'BSON',
      'Schema',
      'Model',
      'mongoose',
      'stack',
    ];

    const hasTechnicalDetails = technicalKeywords.some(keyword => 
      errorMessage.includes(keyword)
    );

    if (hasTechnicalDetails) {
      return fallbackMessage;
    }
  }

  return isDevelopment ? errorMessage : fallbackMessage;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(context, error) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error, context = 'API Error') {
  logError(context, error);
  return getUserFriendlyError(error);
}
