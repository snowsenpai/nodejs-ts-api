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
      <p>Use this <a href="${url}">link</a> to verify your email, </p>
      <h3>${url}</h3>
      <br>
      <p>Link will expire after 1 hour</p>
      `
    });
  }
}

export default EmailService;