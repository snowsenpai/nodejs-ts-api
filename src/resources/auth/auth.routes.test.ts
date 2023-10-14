import { apiPaths, testApp } from 'tests/app-test';
import request from 'supertest';
import cryptoHelpersUtil from '@/utils/crypto-helpers.util';
import * as OTPAuth from 'otpauth';
import { connectDB, dropCollection, closeDB } from '@/utils/database/mongoose-test.util';
import { HttpStatus } from '@/utils/exceptions';
import { sampleFullUser } from 'tests/sample-data';

jest.mock('@sendgrid/mail');

let accessToken: string;
let userOtpBase32: string;

let encryptedEmail_1: string;
let emailVerifyToken: string;

let totpToken: string;

let encryptedEmail_2: string;
let passwordResetToken: string;
let passwordResetSecret: string;

function generateTOTP(secret: string, label?: string) {
  const newTOTP = new OTPAuth.TOTP({
    issuer: process.env.APP_NAME,
    label: label || process.env.APP_NAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });
  return newTOTP;
}

describe('/auth', () => {
  let encryptDataSpy: jest.SpyInstance;

  beforeAll(async () => {
    await connectDB();

    await request(testApp).post(`${apiPaths.userPath}/register`).send({
      firstName: sampleFullUser.firstName,
      lastName: sampleFullUser.lastName,
      email: sampleFullUser.email,
      password: sampleFullUser.password,
    });
  });

  afterAll(async () => {
    await dropCollection('users');
    await closeDB();
  });

  describe('POST /login', () => {
    it('should return an accessToken for an existing user', async () => {
      const res = await request(testApp).post(`${apiPaths.authPath}/login`).send({
        email: sampleFullUser.email,
        password: sampleFullUser.password,
      });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.accessToken).toHaveProperty('token');
      expect(res.body.data.accessToken).toHaveProperty('expiresIn');
      accessToken = res.body.data.accessToken.token;
      expect(res.body.data).toHaveProperty('userOtpEnabled', expect.any(Boolean));
    });

    it('should prevent login if a wrong password is sent', async () => {
      const res = await request(testApp).post(`${apiPaths.authPath}/login`).send({
        email: sampleFullUser.email,
        password: 'wrong-password',
      });

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toHaveProperty('message', 'wrong credentials');
    });
  });

  describe('GET /verify/email', () => {
    beforeEach(() => {
      encryptDataSpy = jest.spyOn(cryptoHelpersUtil, 'encryptData');
    });

    it('should send a verification link to a user`s email', async () => {
      const res = await request(testApp)
        .get(`${apiPaths.authPath}/verify/email`)
        .set('Authorization', `Bearer ${accessToken}`);

      emailVerifyToken = encryptDataSpy.mock.results[0].value;
      encryptedEmail_1 = encryptDataSpy.mock.results[1].value;
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('sendVerifyEmail', true);
    });
  });

  describe('GET /verify/email/:encryptedEmail/:emailToken', () => {
    it('should send a verification link to a user`s email', async () => {
      const res = await request(testApp).get(
        `${apiPaths.authPath}/verify/email/${encryptedEmail_1}/${emailVerifyToken}`,
      );

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('email', sampleFullUser.email);
      expect(res.body.data).toHaveProperty('emailVerified', true);
    });
  });

  describe('GET /otp/generate', () => {
    it('should return credentials needed to set up TOTP with a 3rd party service', async () => {
      const res = await request(testApp)
        .get(`${apiPaths.authPath}/otp/generate`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('otpUrl');
      expect(res.body.data).toHaveProperty('base32Secret');
      userOtpBase32 = res.body.data.base32Secret;
    });
  });

  describe('POST /verify/otp', () => {
    it('verify a 6 digit token string from user`s prefered TOTP service', async () => {
      //if test takes longer than 30 sec token will be invalid and test case will fail
      totpToken = generateTOTP(userOtpBase32, sampleFullUser.email).generate();

      const res = await request(testApp)
        .post(`${apiPaths.authPath}/verify/otp`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: totpToken,
        });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('otpVerified', true);
      expect(res.body.data).toHaveProperty(
        'user',
        expect.objectContaining({
          id: expect.any(String),
          firstName: sampleFullUser.firstName,
          email: sampleFullUser.email,
          otpEnabled: true,
        }),
      );
      expect(res.body.data).toHaveProperty(
        'recoveryCodes',
        expect.arrayContaining([expect.any(String)]),
      );
    });
  });
});
