import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import User from './user.interface';

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
    verified: {
      type: Boolean,
      default: false,
    },
    secret_token: String,
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
    otp_auth_url: String,
    recoveryCodes: [
      {
        hash: String,
        used: Boolean
      }
    ]
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
