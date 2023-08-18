import sgMail from '@sendgrid/mail';
import { TMailOptions } from '../email.types';
import logger from '@/utils/logger.util';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendGrid = async (options: TMailOptions) => {
  try {
    const mailOptions = {
      from: options.from ?? `SnowSenpai <${process.env.APP_EMAIL}>`,
      ...options
    };

    await sgMail.send(mailOptions);
  } catch (error) {
    // ! handle scenarios that could result in a failed attempt, contact an admin(dev)
    // * throwing the error terminates the node process
    // * error: when server is offline
    logger.error(error, 'SendGrid error');
  }
};

export default sendGrid;