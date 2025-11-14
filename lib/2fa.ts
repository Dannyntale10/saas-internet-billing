import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from './prisma'

export interface TwoFactorSecret {
  secret: string
  qrCode: string
  backupCodes: string[]
}

/**
 * Generate 2FA secret for a user
 */
export async function generate2FASecret(userId: string): Promise<TwoFactorSecret> {
  const secret = speakeasy.generateSecret({
    name: `JENDA MOBILITY (${userId})`,
    issuer: 'JENDA MOBILITY'
  })

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  )

  // Store secret in database (you'll need to add a twoFactorSecret field to User model)
  // For now, we'll return it - you should encrypt and store it
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { twoFactorSecret: secret.base32 }
  // })

  return {
    secret: secret.base32!,
    qrCode,
    backupCodes
  }
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps (60 seconds) of tolerance
  })
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  // You'll need to add a backupCodes field to User model
  // const user = await prisma.user.findUnique({ where: { id: userId } })
  // if (!user?.backupCodes) return false
  
  // const codes = JSON.parse(user.backupCodes)
  // const index = codes.indexOf(code)
  // if (index === -1) return false
  
  // Remove used code
  // codes.splice(index, 1)
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { backupCodes: JSON.stringify(codes) }
  // })
  
  return true // Placeholder
}

