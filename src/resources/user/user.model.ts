import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import User from './user.interface';

const UserSchema = new Schema({
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
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
    secret_token: {
      type: String,
      select: false,
    },
    password_reset_request: {
      type: Boolean,
      default: false
    },
    grant_password_reset: {
      type: Boolean,
      default: false
    },
    otp_enabled: {
      type: Boolean,
      default: false,
    },
    otp_verified: {
      type: Boolean,
      default: false,
    },
    otp_base32: {
      type: String,
      select: false,
    },
    otp_auth_url: {
      type: String,
      select: false,
    },
    recovery_codes: {
      type: [{ hash: String, used: Boolean }],
      select: false,
    }
  }, {
    timestamps: true,
    toJSON: {
      virtuals: true
    }
  }
);

UserSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

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
