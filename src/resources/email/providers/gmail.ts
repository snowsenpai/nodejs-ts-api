import * as nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { TMailOptions } from '../email.types';

const user = process.env.APP_EMAIL!;

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN!;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oAuth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
});

const gmail = async (options: TMailOptions) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

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
      from: `SnowSenpai <${user}>`,
      ...options
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

export default gmail;