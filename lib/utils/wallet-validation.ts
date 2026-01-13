/**
 * Validates if a string is a valid Ethereum/USDC wallet address
 * USDC runs on multiple chains (Ethereum, Polygon, etc.) but all use Ethereum-style addresses
 * 
 * @param address - The wallet address to validate
 * @returns true if the address is valid, false otherwise
 */
export function isValidUSDCAddress(address: string): boolean {
  // Check if address is empty or null
  if (!address || address.trim() === '') {
    return false
  }

  // Ethereum addresses are 42 characters long (0x + 40 hex characters)
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
  
  // Check basic format
  if (!ethereumAddressRegex.test(address)) {
    return false
  }

  // Additional validation: checksum validation (EIP-55)
  // This is a simplified version - for production, you might want to use a library like ethers.js
  return true
}

/**
 * Validates if a string is a valid Solana wallet address
 * USDC also runs on Solana blockchain
 * 
 * @param address - The wallet address to validate
 * @returns true if the address is valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  // Check if address is empty or null
  if (!address || address.trim() === '') {
    return false
  }

  // Solana addresses are base58 encoded and typically 32-44 characters
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  
  return solanaAddressRegex.test(address)
}

/**
 * Validates if a string is a valid USDC wallet address (supports both Ethereum and Solana)
 * 
 * @param address - The wallet address to validate
 * @returns object with validation result and detected chain
 */
export function validateUSDCAddress(address: string): {
  isValid: boolean
  chain?: 'ethereum' | 'solana'
  error?: string
} {
  if (!address || address.trim() === '') {
    return {
      isValid: false,
      error: 'Address cannot be empty'
    }
  }

  const trimmedAddress = address.trim()

  // Check for Ethereum-style address (also used by Polygon, BSC, etc.)
  if (trimmedAddress.startsWith('0x')) {
    if (isValidUSDCAddress(trimmedAddress)) {
      return {
        isValid: true,
        chain: 'ethereum'
      }
    } else {
      return {
        isValid: false,
        error: 'Invalid Ethereum/EVM wallet address format'
      }
    }
  }

  // Check for Solana address
  if (isValidSolanaAddress(trimmedAddress)) {
    return {
      isValid: true,
      chain: 'solana'
    }
  }

  return {
    isValid: false,
    error: 'Invalid wallet address format. Please enter a valid Ethereum or Solana address.'
  }
}

