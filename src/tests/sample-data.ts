import { TSortBy } from '@/middleware/pagination.middleware';
import { Types } from 'mongoose';

const objectId = new Types.ObjectId().toString();

const sampleTag = {
  _id: new Types.ObjectId().toString(),
  name: 'Test Tag',
  description: 'just used for testing',
};

const password = 'newPassword';

const sampleUser = {
  _id: new Types.ObjectId().toString(),
  firstName: 'Test',
  lastName: 'User',
  email: 'user@test.com',
  verified: false,
  otpVerified: false,
  otpEnabled: false,
  role: 'user',
  passwordResetRequest: false,
  grantPasswordReset: false,
  posts: [],
  populate: jest.fn(),
  save: jest.fn(),
};

const sampleFullUser = {
  ...sampleUser,
  password: 'hashedPassword',
  secretToken: '',
  otpAuthUrl: '',
  otpBase32: '',
  recoveryCodes: [{ hash: 'hash1', used: false }],
};

const samplePost = {
  _id: new Types.ObjectId().toString(),
  title: 'test post',
  body: 'tests can be nice',
  creator: sampleUser._id,
  tags: [sampleTag._id],
  deleteOne: jest.fn(),
};

const samplePostPopulated = {
  ...samplePost,
  creator: sampleUser,
};

const tagsId = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];

const getPaginationResult = (
  currentPage: number,
  nextPage: number | null,
  prevPage: number | null,
  lastPage: number,
) => ({
  currentPage,
  nextPage,
  prevPage,
  lastPage,
});

const getPaginationDetails = (
  filterValue: string[],
  filterField: string,
  limit: number,
  page: number,
  search: string,
  sortBy: TSortBy,
) => ({
  filterValue,
  filterField,
  limit,
  page,
  search,
  sortBy,
});

export {
  objectId,
  samplePost,
  sampleTag,
  password,
  sampleUser,
  sampleFullUser,
  samplePostPopulated,
  tagsId,
  getPaginationDetails,
  getPaginationResult,
};
