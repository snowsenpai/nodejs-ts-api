import sendGrid from './providers/sendGrid';
import templates from './templates';

class EmailService {
  /**
   * Send a welcome mail to new users
   * @param email user's email
   * @param firstName user's first name
   * @returns boolean
   */
  public async sendWelcomeEmail(email: string, firstName: string) {
    await sendGrid({
      to: email,
      subject: 'Welcome!',
      html: templates.generateWelcomeEmail(firstName),
    });
  }

  /**
   * Send verification email
   * @param email user's email
   * @param firstName user's first name
   * @param url verification url
   * @returns boolean
   */
  public async sendVerifyMail(email: string, firstName: string, url: string) {
    await sendGrid({
      to: email,
      subject: 'Verify your email address',
      html: templates.generateVerifyEmail(firstName, url),
    });
  }

  /**
   * sendPasswordResetMail
   */
  public async sendPasswordResetMail(email: string, firstName: string, url: string) {
    await sendGrid({
      to: email,
      subject: 'Verify reset password request',
      html: templates.generateResetPasswordEmail(firstName, url),
    });
  }
}

export default EmailService;
