import sgMail from '@sendgrid/mail';
import { TMailOptions } from '../email.types';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendGrid = async (options: TMailOptions) => {
  try {
    const mailOptions = {
      from: options.from ?? `SnowSenpai <${process.env.APP_EMAIL}>`,
      ...options
    };

    await sgMail.send(mailOptions);
  } catch (error) {
    throw error;
  }
};

export default sendGrid;