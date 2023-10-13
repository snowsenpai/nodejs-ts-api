import { apiPaths, testApp } from 'tests/app-test';
import request from 'supertest';
import cryptoHelpersUtil from '@/utils/crypto-helpers.util';
import * as OTPAuth from 'otpauth';
import { connectDB, dropCollection, closeDB } from '@/utils/database/mongoose-test.util';
import { HttpStatus } from '@/utils/exceptions';
import { sampleFullUser } from 'tests/sample-data';

jest.mock('@sendgrid/mail');

let accessToken: string;

let encryptedEmail_1: string;
let emailVerifyToken: string;

let encryptedEmail_2: string;
let passwordResetToken: string;
let passwordResetSecret: string;

describe('/auth', () => {
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
    it('should return accessToken for an existing user', async () => {
      //
    });
  });
});
