import { Response, Request, NextFunction } from 'express';
import AuthService from './auth.service';
import { HttpStatus } from '@/utils/exceptions/http-status.enum';

const authService = new AuthService();

async function login (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { email, password } = req.body;

    const data = await authService.login(email, password);

    res.status(HttpStatus.OK)
    .json({
      message: 'login successful',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function generateOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;

    const data = await authService.generateOTP(userId);

    res.status(HttpStatus.OK)
    .json({
      message: 'generated otp credentials sucessfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function verifyOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id
    const { token } = req.body;

    const data = await authService.verifyOTP(userId, token);

    res.status(HttpStatus.OK)
    .json({
      message: 'otp verified, two factor authentication is enabled',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function validateOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    const data = await authService.validateOTP(userId, token);

    res.status(HttpStatus.OK)
    .json({
      message: 'otp is valid',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function disableOTP(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    const data = await authService.disabelOTP(userId, token);

    res.status(HttpStatus.OK)
    .json({
      message: 'otp and two factor authentication disabled successfully',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function otpQRCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;

    const { otpAuthUrl } = await authService.otpData(userId);

    authService.responseWithQRCode(otpAuthUrl, res);
  } catch (error) {
    next(error);
  }
}

async function validateRecoveryCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;
    const { code } = req.body;

    const data = await authService.validCode(userId, code);

    res.status(HttpStatus.OK)
    .json({
      message: 'recovery code is valid and cannot be used again',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void>{
  try {
    const userId = req.user._id;
    const data = await authService.verifyEmail(userId);

    res.status(HttpStatus.OK).json(data);
  } catch (error) {
    next(error)
  }
}

async function validateEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { encryptedEmail, emailToken } = req.params;

    const data = await authService.validateEmail(encryptedEmail, emailToken);

    res.status(HttpStatus.OK)
    .json({
      message: 'email account verified successfully',
      data
    });
  } catch (error) {
    next(error)
  }
}

async function passwordResetRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;

    const data = await authService.passwordResetRequest(userId);

    res.status(HttpStatus.OK)
    .json({
      message: 'a password reset email has been sent',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function validatePasswordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { encryptedEmail, passwordToken } = req.params;

    const data = await authService.validatePasswordReset(encryptedEmail, passwordToken);

    res.status(HttpStatus.OK)
    .json({
      message: 'password reset permission granted',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { newPassword } = req.body;
    const userId = req.user._id;
    const passwordToken = req.passwordResetSecret;

    const data = await authService.resetPassword(userId, passwordToken, newPassword);

    res.status(HttpStatus.OK)
    .json({
      message: 'password reset successful, please login with your new credentials',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function cancelPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;
    const passwordToken = req.passwordResetSecret;

    const data = await authService.cancelPasswordReset(userId, passwordToken);

    res.status(HttpStatus.OK)
    .json({
      message: 'password reset has been canceled',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function updateEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;
    const oldEmail = req.user.email;
    const { newEmail } = req.body;

    const data = await authService.updateEmail(userId, oldEmail, newEmail);

    res.status(HttpStatus.OK).json(data);
  } catch (error) {
    next(error);
  }
}

export default {
  cancelPasswordReset,
  disableOTP,
  generateOTP,
  login,
  otpQRCode,
  passwordResetRequest,
  resetPassword,
  updateEmail,
  validateEmail,
  validateOTP,
  validatePasswordReset,
  validateRecoveryCode,
  verifyEmail,
  verifyOTP,
};
