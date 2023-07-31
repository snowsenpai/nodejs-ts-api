import { Router } from "express";
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/auth/auth.validation';
import authenticated from '@/middleware/authenticated.middleware';
import passwordReset from '@/middleware/password_reset.middleware';
import AuthController from "./auth.controller";

const authController = new AuthController();
const authRouter = Router();

const basePath = '/auth';

authRouter.get(
  `${basePath}/otp/auth-qrcode`,
  authenticated,
  authController.otpQRCode.bind(authController)
);

authRouter.get(
  `${basePath}/verify/email`,
  authenticated,
  authController.verifyEmail.bind(authController)
);

authRouter.get(
  `${basePath}/validate/email/:encryptedEmail/:emailToken`,
  authController.validateEmail.bind(authController)
);

authRouter.get(
  `${basePath}/password-reset-request`,
  authenticated,
  authController.passwordResetRequest.bind(authController)
);

authRouter.get(
  `${basePath}/validate/password-reset-request/:encryptedEmail/:passwordToken`,
  authController.validatePasswordReset.bind(authController)
);

authRouter.get(
  `${basePath}/cancel-password-reset`,
  authenticated,
  passwordReset,
  authController.cancelPasswordReset.bind(authController)
);

authRouter.post(
  `${basePath}/login`,
  validationMiddleware(validate.login),
  authController.login.bind(authController)
);

authRouter.post(
  `${basePath}/reset-password`,
  authenticated,
  passwordReset,
  validationMiddleware(validate.resetPassword),
  authController.resetPassword.bind(authController)
);

authRouter.post(
  `${basePath}/otp/generate`,
  authenticated,
  authController.generateOTP.bind(authController)
);

authRouter.post(
  `${basePath}/otp/verify`,
  authenticated,
  validationMiddleware(validate.otpToken),
  authController.verifyOTP.bind(authController)
);

authRouter.post(
  `${basePath}/otp/validate`,
  authenticated,
  validationMiddleware(validate.otpToken),
  authController.validateOTP.bind(authController)
);

authRouter.post(
  `${basePath}/otp/disable`,
  authenticated,
  validationMiddleware(validate.otpToken),
  authController.disableOTP.bind(authController)
);

authRouter.post(
  `${basePath}/verify/recovery-code`,
  authenticated,
  validationMiddleware(validate.recoveryCode),
  authController.validateRecoveryCode.bind(authController)
);

authRouter.patch(
  `${basePath}/update-email`,
  authenticated,
  validationMiddleware(validate.updateEmail),
  authController.updateEmail.bind(authController)
);

export default authRouter;
