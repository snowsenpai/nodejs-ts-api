import sendGrid from "./providers/sendGrid";

class EmailService {
  /**
   * Send a welcome mail to new users
   * @param email user's email
   * @param first_name user's first name
   * @returns boolean
   */
  public async sendWelcomeEmail(email: string, first_name: string) {
    await sendGrid({
      to: email,
      subject: 'Welcome!',
      html: `
        <h2>Hi ${first_name},</h2> 
        <p>Your account has been sucessfully created, to access other services ensure you verify your email.</p>
      `
    });
  }

  /**
   * Send verification email
   * @param email user's email
   * @param first_name user's first name
   * @param url verification url
   * @returns boolean
   */
  public async sendVerifyMail(email: string, first_name: string, url: string) {
    await sendGrid({
      to: email,
      subject: 'Verify your email address',
      text: 'to access all our services',
      html: `
      <h2>Hi ${first_name},</h2> 
      <p>Use this <a href="${url}" target="_blank">link</a> to verify your email.</p>
      <p>Button not working? Paste the following link into ypur browser:</p>
      <p>${url}</p>
      <p>For your security, the reset password link will expire after 1 hour</p>
      `
    });
  }

  /**
   * sendPasswordResetMail
   */
  public async sendPasswordResetMail(email: string, first_name: string, url: string) {
    await sendGrid({
      to: email,
      subject: 'Verify password reset request',
      html: `
      <h2>Hi ${first_name},</h2>
      <p>We recived a request to reset your password, use this <a href="${url}" target="_blank">link</a> to approve the request.</p> 
      <p>Button not working? Paste the following link into ypur browser:</p>
      <p>${url}</p>
      <p>For your security, the reset password link will expire after 1 hour</p>
      <p>If you belive that this request is suspicious, please contatct our <a href="#">support team</a></p>
      `
    });
  }
}

export default EmailService;