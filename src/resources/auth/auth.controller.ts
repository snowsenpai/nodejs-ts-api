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
      this.verifyOTP.bind(this)
    );

    this.router.post(
      `${this.path}/otp/validate`,
      authenticated,
      this.validateOTP.bind(this)
    );

    this.router.post(
      `${this.path}/otp/disable`,
      authenticated,
      this.disableOTP.bind(this)
    );
  }

  private async generateOTP() {
    
  }

  private async verifyOTP() {
    
  }

  private async validateOTP() {
    
  }

  private async disableOTP() {
    
  }
}

export default AuthController;
