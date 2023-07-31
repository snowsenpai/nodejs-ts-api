import { Response, Request, NextFunction } from 'express';
import AuthService from './auth.service';

class AuthController {
  private AuthService = new AuthService();

  public async login (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      const accessToken = await this.AuthService.login(email, password);

      res.status(200).json(accessToken);
    } catch (error) {
      next(error);
    }
  }

  public async generateOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;

      const data = await this.AuthService.generateOTP(userId);

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  public async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id
      const { token } = req.body;

      const result = await this.AuthService.verifyOTP(userId, token);

      res.status(201).json({ result });
    } catch (error) {
      next(error);
    }
  }

  public async validateOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const { token } = req.body;

      const result = await this.AuthService.validateOTP(userId, token);

      res.status(200).json({ result });
    } catch (error) {
      next(error);
    }
  }

  public async disableOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const { token } = req.body;

      const result = await this.AuthService.disabelOTP(userId, token);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async otpQRCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;

      const { otpAuthUrl } = await this.AuthService.otpData(userId);

      this.AuthService.responseWithQRCode(otpAuthUrl, res);
    } catch (error) {
      next(error);
    }
  }

  public async validateRecoveryCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const { code } = req.body;
  
      const result = await this.AuthService.validCode(userId, code);

      res.status(201).json(result)
    } catch (error) {
      next(error);
    }
  }

  public async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void>{
    try {
      const userId = req.user._id;
      const message = await this.AuthService.verifyEmail(userId);

      res.status(201).json({message});
    } catch (error) {
      next(error)
    }
  }

  public async validateEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { encryptedEmail, emailToken } = req.params;

      const data = await this.AuthService.validateEmail(encryptedEmail, emailToken);

      res.status(201).json(data);
    } catch (error) {
      next(error)
    }
  }

  public async passwordResetRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;

      const message = await this.AuthService.passwordResetRequest(userId);

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  public async validatePasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { encryptedEmail, passwordToken } = req.params;

      const data = await this.AuthService.validatePasswordReset(encryptedEmail, passwordToken);

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { newPassword } = req.body;
      const userId = req.user._id;
      const passwordToken = req.passwordResetSecret;

      const data = await this.AuthService.resetPassword(userId, passwordToken, newPassword);

      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  public async cancelPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const passwordToken = req.passwordResetSecret;

      const result = await this.AuthService.cancelPasswordReset(userId, passwordToken);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async updateEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const oldEmail = req.user.email;
      const { newEmail } = req.body;

      const result = await this.AuthService.updateEmail(userId, oldEmail, newEmail);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
