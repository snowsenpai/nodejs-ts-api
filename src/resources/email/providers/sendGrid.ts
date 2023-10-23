import sgMail from '@sendgrid/mail';
import { TMailOptions } from '../email.types';
import logger from '@/utils/logger.util';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

/**
 * A wrapper function for Twilio SendGrip API integration.
 */
const sendGrid = async (options: TMailOptions) => {
  try {
    const mailOptions = {
      from: options.from ?? `SnowSenpai <${process.env.APP_EMAIL}>`,
      ...options,
    };

    await sgMail.send(mailOptions);
  } catch (error) {
    //! handle scenarios that could result in a failed attempt and contact an admin(dev)
    // e.g error: when server is offline
    // throwing the error terminates the node process
    logger.error(error, 'SendGrid error');
  }
};

export default sendGrid;
