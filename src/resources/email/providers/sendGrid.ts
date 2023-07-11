import * as sgMail from '@sendgrid/mail';
import { TMailOptions } from '../email.types';
import logger from '@/utils/logger';

console.log(process.env.SENDGRID_API_KEY);
console.log(process.env.APP_EMAIL);
// non-null assertion operator `!`, variable must be defined else runtime error
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendMail = async (options: TMailOptions) => {
  try {
    // set a default value for the `from` field
    const mailOptions = {
      from: options.from ?? `SnowSenpai <${process.env.APP_EMAIL}>`,
      ...options
    };

    const result = await sgMail.send(mailOptions);
    return result;
  } catch (error) {
    logger.warn('Could not send mail');
    return error;
  }
};

export default sendMail;