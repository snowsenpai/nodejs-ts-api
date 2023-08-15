import { Response, Request, NextFunction } from 'express';
import AuthService from './auth.service';

const authService = new AuthService();

async function login (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { email, password } = req.body;

    const accessToken = await authService.login(email, password);

    res.status(200).json(accessToken);
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

    res.status(201).json(data);
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

    const result = await authService.verifyOTP(userId, token);

    res.status(201).json(result);
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

    const result = await authService.validateOTP(userId, token);

    res.status(200).json(result);
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

    const result = await authService.disabelOTP(userId, token);

    res.status(201).json(result);
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

    const result = await authService.validCode(userId, code);

    res.status(201).json(result)
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
    const message = await authService.verifyEmail(userId);

    res.status(201).json(message);
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

    res.status(201).json(data);
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

    const message = await authService.passwordResetRequest(userId);

    res.status(201).json(message);
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

    res.status(201).json(data);
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

    res.status(201).json(data);
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

    const result = await authService.cancelPasswordReset(userId, passwordToken);

    res.status(201).json(result);
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

    const result = await authService.updateEmail(userId, oldEmail, newEmail);

    res.status(201).json(result);
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
