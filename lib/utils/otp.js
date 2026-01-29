/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Get OTP expiry time (10 minutes from now)
 * @returns {Date} Expiry date
 */
export function getOTPExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
}

/**
 * Check if OTP is valid
 * @param {string} providedOTP - OTP provided by user
 * @param {string} storedOTP - OTP stored in database
 * @param {Date} expiryDate - OTP expiry date
 * @returns {boolean} True if OTP is valid
 */
export function isOTPValid(providedOTP, storedOTP, expiryDate) {
  if (!providedOTP || !storedOTP || !expiryDate) {
    return false
  }

  // Check if OTP matches
  if (providedOTP !== storedOTP) {
    return false
  }

  // Check if OTP has expired
  if (new Date() > new Date(expiryDate)) {
    return false
  }

  return true
}
