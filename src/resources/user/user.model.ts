import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './user.interface';

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    secretToken: {
      type: String,
      select: false,
    },
    passwordResetRequest: {
      type: Boolean,
      default: false,
    },
    grantPasswordReset: {
      type: Boolean,
      default: false,
    },
    otpEnabled: {
      type: Boolean,
      default: false,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    otpBase32: {
      type: String,
      select: false,
    },
    otpAuthUrl: {
      type: String,
      select: false,
    },
    recoveryCodes: {
      type: [{ hash: String, used: Boolean }],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'creator',
});

UserSchema.pre<User>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

UserSchema.methods.isValidPassword = async function (password: string): Promise<Error | boolean> {
  return await bcrypt.compare(password, this.password);
};

export const UserModel = model<User>('User', UserSchema);
