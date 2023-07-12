import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { TMailOptions } from '../email.types';

const user = process.env.APP_EMAIL!;

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN!;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
});

const gmail = async (options: TMailOptions) => {
  try {
    const accessToken = await oauth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: user,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: String(accessToken.token)
      }
    });

    const mailOptions = {
      from: options.from ?? `SnowSenpai <${process.env.APP_EMAIL}>`,
      ...options
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

export default gmail;