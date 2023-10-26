import sendGrid from './providers/sendGrid';
import templates from './templates';

/**
 * Methods to send emails from the server using API wrappers for email service providers.
 */
class EmailService {
  /**
   * Send a welcome email to new users
   * @param email - user's email
   * @param firstName - user's first name
   */
  public async sendWelcomeEmail(email: string, firstName: string) {
    await sendGrid({
      to: email,
      subject: 'Welcome!',
      html: templates.generateWelcomeEmail(firstName),
    });
  }

  /**
   * Send a verification email.
   * @param email - user's email.
   * @param firstName - user's first name.
   * @param url - verification url.
   */
  public async sendVerifyMail(email: string, firstName: string, url: string) {
    await sendGrid({
      to: email,
      subject: 'Verify your email address',
      html: templates.generateVerifyEmail(firstName, url),
    });
  }

  /**
   * Send a password reset email.
   * @param email - user's email.
   * @param firstName - user's first name.
   * @param url - verification url.
   */
  public async sendPasswordResetMail(email: string, firstName: string, url: string) {
    await sendGrid({
      to: email,
      subject: 'Verify reset password request',
      html: templates.generateResetPasswordEmail(firstName, url),
    });
  }

  // static method to send emails to admin.
}

export default EmailService;
