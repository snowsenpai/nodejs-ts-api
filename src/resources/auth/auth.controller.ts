import { Router, Response, Request, NextFunction } from 'express';
import * as QRCOde from 'qrcode';
import Controller from '@/utils/interfaces/controller.interface';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/auth/auth.validation';
import AuthService from './auth.service';
import authenticated from '@/middleware/authenticated.middleware';

class AuthController implements Controller{
  public path = '/auth';
  public router = Router();
  private AuthService = new AuthService();

  private initialiseRoutes(): void {
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
  }

  private async generateOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const { token } = req.body;
      
    } catch (error) {
      next(error);
    }
  }

  private writeQRCode(data: string, res: Response) {
    QRCOde.toFileStream(res, data);
  }

  private async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id
      const { token } = req.body;

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

    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
