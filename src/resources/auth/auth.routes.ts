import { Router } from "express";
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/auth/auth.validation';
import authenticated from '@/middleware/authenticated.middleware';
import passwordReset from '@/middleware/password_reset.middleware';
import AuthController from "./auth.controller";

const authController = AuthController;
const authRouter = Router();

const basePath = '/auth';

authRouter.get(
  `${basePath}/otp/auth-qrcode`,
  authenticated,
  authController.otpQRCode
);

authRouter.get(
  `${basePath}/verify/email`,
  authenticated,
  authController.verifyEmail
);

authRouter.get(
  `${basePath}/validate/email/:encryptedEmail/:emailToken`,
  authController.validateEmail
);

authRouter.get(
  `${basePath}/password-reset-request`,
  authenticated,
  authController.passwordResetRequest
);

authRouter.get(
  `${basePath}/validate/password-reset-request/:encryptedEmail/:passwordToken`,
  authController.validatePasswordReset
);

authRouter.get(
  `${basePath}/cancel-password-reset`,
  authenticated,
  passwordReset,
  authController.cancelPasswordReset
);

authRouter.post(
  `${basePath}/login`,
  validationMiddleware(validate.login),
  authController.login
);

authRouter.post(
  `${basePath}/reset-password`,
  authenticated,
  passwordReset,
  validationMiddleware(validate.resetPassword),
  authController.resetPassword
);

authRouter.post(
  `${basePath}/otp/generate`,
  authenticated,
  authController.generateOTP
);

authRouter.post(
  `${basePath}/otp/verify`,
  authenticated,
  validationMiddleware(validate.otpToken),
  authController.verifyOTP
);

authRouter.post(
  `${basePath}/otp/validate`,
  authenticated,
  validationMiddleware(validate.otpToken),
  authController.validateOTP
);

authRouter.post(
  `${basePath}/otp/disable`,
  authenticated,
  validationMiddleware(validate.otpToken),
  authController.disableOTP
);

authRouter.post(
  `${basePath}/verify/recovery-code`,
  authenticated,
  validationMiddleware(validate.recoveryCode),
  authController.validateRecoveryCode
);

authRouter.patch(
  `${basePath}/update-email`,
  authenticated,
  validationMiddleware(validate.updateEmail),
  authController.updateEmail
);

export default authRouter;
