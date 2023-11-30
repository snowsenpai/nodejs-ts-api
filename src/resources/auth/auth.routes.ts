import { Router } from 'express';
import { validation } from '@/middlewares/validation.middleware';
import * as validate from '@/resources/auth/auth.validation';
import { authenticated } from '@/middlewares/authenticated.middleware';
import { passwordReset } from '@/middlewares/password-reset.middleware';
import { getFullUrl } from '@/middlewares/full-url.middleware';
import * as authController from './auth.controller';

export const authRouter = Router();

const basePath = '/auth';

authRouter.get(`${basePath}/otp/generate`, authenticated, authController.generateOTP);

authRouter.get(`${basePath}/otp/auth-qrcode`, authenticated, authController.otpQRCode);

authRouter.get(
  `${basePath}/verify/email`,
  getFullUrl(false),
  authenticated,
  authController.verifyEmail,
);

authRouter.get(
  `${basePath}/verify/email/:encryptedEmail/:emailToken`,
  validation(validate.emailValidation, 'params'),
  authController.validateEmail,
);

authRouter.get(
  `${basePath}/password-reset`,
  getFullUrl(false),
  authenticated,
  authController.passwordResetRequest,
);

authRouter.get(
  `${basePath}/password-reset/:encryptedEmail/:passwordToken`,
  validation(validate.passwordReset, 'params'),
  authController.validatePasswordReset,
);

authRouter.get(
  `${basePath}/cancel-password-reset`,
  authenticated,
  passwordReset,
  authController.cancelPasswordReset,
);

authRouter.post(`${basePath}/login`, validation(validate.login, 'body'), authController.login);

authRouter.post(
  `${basePath}/reset-password`,
  validation(validate.resetPassword, 'body'),
  authenticated,
  passwordReset,
  authController.resetPassword,
);

authRouter.post(
  `${basePath}/verify/otp`,
  validation(validate.otpToken, 'body'),
  authenticated,
  authController.verifyOTP,
);

authRouter.post(
  `${basePath}/validate/otp`,
  validation(validate.otpToken, 'body'),
  authenticated,
  authController.validateOTP,
);

authRouter.post(
  `${basePath}/disable/otp`,
  validation(validate.otpToken, 'body'),
  authenticated,
  authController.disableOTP,
);

authRouter.post(
  `${basePath}/verify/recovery-code`,
  validation(validate.recoveryCode, 'body'),
  authenticated,
  authController.validateRecoveryCode,
);

authRouter.patch(
  `${basePath}/email`,
  validation(validate.updateEmail, 'body'),
  getFullUrl(false),
  authenticated,
  authController.updateEmail,
);
