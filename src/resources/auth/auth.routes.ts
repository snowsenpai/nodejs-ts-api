import { Router } from 'express';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/auth/auth.validation';
import authenticated from '@/middleware/authenticated.middleware';
import passwordReset from '@/middleware/password-reset.middleware';
import getFullUrl from '@/middleware/full-url.middleware';
import authController from './auth.controller';

const authRouter = Router();

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
  validationMiddleware(validate.emailValidation, 'params'),
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
  validationMiddleware(validate.passwordReset, 'params'),
  authController.validatePasswordReset,
);

authRouter.get(
  `${basePath}/cancel-password-reset`,
  authenticated,
  passwordReset,
  authController.cancelPasswordReset,
);

authRouter.post(
  `${basePath}/login`,
  validationMiddleware(validate.login, 'body'),
  authController.login,
);

authRouter.post(
  `${basePath}/reset-password`,
  validationMiddleware(validate.resetPassword, 'body'),
  authenticated,
  passwordReset,
  authController.resetPassword,
);

authRouter.post(
  `${basePath}/verify/otp`,
  validationMiddleware(validate.otpToken, 'body'),
  authenticated,
  authController.verifyOTP,
);

authRouter.post(
  `${basePath}/validate/otp`,
  validationMiddleware(validate.otpToken, 'body'),
  authenticated,
  authController.validateOTP,
);

authRouter.post(
  `${basePath}/disable/otp`,
  validationMiddleware(validate.otpToken, 'body'),
  authenticated,
  authController.disableOTP,
);

authRouter.post(
  `${basePath}/verify/recovery-code`,
  validationMiddleware(validate.recoveryCode, 'body'),
  authenticated,
  authController.validateRecoveryCode,
);

authRouter.patch(
  `${basePath}/email`,
  validationMiddleware(validate.updateEmail, 'body'),
  getFullUrl(false),
  authenticated,
  authController.updateEmail,
);

export default authRouter;
