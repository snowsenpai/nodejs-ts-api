/**
 * `UserService`: should have appropriate methods to mutate and validate a
 * (`UserModel`: should have required security(e.g pass word) and otp fields
 * retrived user object from the database using a unique identifier e.g
 * user.id; this available to other controllers via middleware req.user.id)
 */

/**
 * the `User` object | interface must staisfy these fields
 */
export type hashedRecoveryCodes = {
  hash: string,
  used: boolean
}[]

type user_otp = {
  otp_enabled: boolean;
  otp_verified: boolean;
  otp_ascii: string;
  otp_hex: string;
  otp_base32: string;
  otp_auth_url: string;
}