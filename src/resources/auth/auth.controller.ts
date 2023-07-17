import { Router, Response, Request, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/auth/auth.validation';
import AuthService from './auth.service';
import authenticated from '@/middleware/authenticated.middleware';

class AuthController implements Controller{
  public path = '/auth';
  public router = Router();
  private AuthService = new AuthService();

  constructor() {
    this.initialiseRoutes();
  }

  private initialiseRoutes(): void {
    this.router.get(
      `${this.path}/otp/auth-qrcode`,
      authenticated,
      this.otpQRCode.bind(this)
    );

    this.router.get(
      `${this.path}/verify/email`,
      authenticated,
      this.verifyEmail.bind(this)
    );

    this.router.get(
      `${this.path}/validate/email/:encryptedEmail/:emailToken`,
      this.validateEmail.bind(this)
    );

    this.router.post(
      `${this.path}/otp/generate`,
      authenticated,
      this.generateOTP.bind(this)
    );

    this.router.post(
      `${this.path}/otp/verify`,
      authenticated,
      validationMiddleware(validate.otpToken),
      this.verifyOTP.bind(this)
    );

    this.router.post(
      `${this.path}/otp/validate`,
      authenticated,
      validationMiddleware(validate.otpToken),
      this.validateOTP.bind(this)
    );

    this.router.post(
      `${this.path}/otp/disable`,
      authenticated,
      validationMiddleware(validate.otpToken),
      this.disableOTP.bind(this)
    );

    this.router.post(
      `${this.path}/verify/recovery-code`,
      authenticated,
      validationMiddleware(validate.recoveryCode),
      this.validateRecoveryCode.bind(this)
    )
  }

  private async generateOTP(
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

  private async verifyOTP(
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

  private async validateOTP(
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

  private async disableOTP(
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

  private async otpQRCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;

      const { otp_auth_url } = await this.AuthService.otpData(userId);

      this.AuthService.responseWithQRCode(otp_auth_url, res);
    } catch (error) {
      next(error);
    }
  }

  private async validateRecoveryCode(
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

  private async verifyEmail(
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

  private async validateEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { encryptedEmail, emailToken } = req.params;

      const data = await this.AuthService.validateEmail(encryptedEmail, emailToken);

      res.status(201).json(data)
    } catch (error) {
      next(error)
    }
  }
}

export default AuthController;
