import sgMail from '@sendgrid/mail';
import { TMailOptions } from '../email.types';

// non-null assertion operator `!`, variable must be defined else runtime error
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendGrid = async (options: TMailOptions) => {
  try {
    // set a default value for the `from` field
    const mailOptions = {
      from: options.from ?? `SnowSenpai <${process.env.APP_EMAIL}>`,
      ...options
    };

    const result = await sgMail.send(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
};

export default sendGrid;