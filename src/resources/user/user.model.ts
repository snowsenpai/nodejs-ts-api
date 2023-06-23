import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import User from './user.interface';

const OTPSChema = new Schema({
  otp_enabled: {
    type: Boolean,
    default: false,
  },
  otp_verified: {
    type: Boolean,
    default: false,
  },
  otp_ascii: String,
  otp_hex: String,
  otp_base32: String,
  otp_auth_url: String
});

const UserSchema = new Schema({
    name: {
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
    },
    role: {
      type: String,
      required: true,
    },
    two_factor: OTPSChema,
  }, {
    timestamps: true,
    toJSON: {
      virtuals: true
    }
  }
);

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'creator'
});

UserSchema.pre<User>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

UserSchema.methods.isValidPassword = async function (
  password: string
): Promise<Error | boolean> {
  return await bcrypt.compare(password, this.password);
};

export default model<User>('User', UserSchema);
