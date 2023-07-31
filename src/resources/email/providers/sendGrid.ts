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

    await sgMail.send(mailOptions);
  } catch (error) {
    throw error;
  }
};

export default sendGrid;