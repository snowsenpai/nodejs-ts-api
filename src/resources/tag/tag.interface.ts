import { Document } from 'mongoose';

export default interface Tag extends Document {
  name: string;
  description: string;
}
