/**
 * Validates a Twitter/X handle
 * @param handle - The Twitter handle to validate (with or without @)
 * @returns true if valid, false otherwise
 */
export function isValidTwitterHandle(handle: string): boolean {
  if (!handle || handle.trim() === '') {
    return false
  }

  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle

  // Twitter handles are 1-15 characters, alphanumeric and underscores only
  const twitterRegex = /^[A-Za-z0-9_]{1,15}$/
  
  return twitterRegex.test(cleanHandle)
}

/**
 * Validates an Instagram handle
 * @param handle - The Instagram handle to validate (with or without @)
 * @returns true if valid, false otherwise
 */
export function isValidInstagramHandle(handle: string): boolean {
  if (!handle || handle.trim() === '') {
    return false
  }

  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle

  // Instagram handles are 1-30 characters, alphanumeric, underscores and periods
  // Cannot end with a period
  const instagramRegex = /^[A-Za-z0-9_.]{1,30}$/
  
  if (!instagramRegex.test(cleanHandle)) {
    return false
  }

  // Check if it ends with a period (not allowed)
  if (cleanHandle.endsWith('.')) {
    return false
  }

  return true
}

/**
 * Normalizes a social media handle by removing @ if present
 * @param handle - The handle to normalize
 * @returns The normalized handle
 */
export function normalizeSocialHandle(handle: string): string {
  if (!handle) return ''
  return handle.startsWith('@') ? handle.slice(1) : handle
}

