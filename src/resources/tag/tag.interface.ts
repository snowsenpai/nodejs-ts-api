import { Document } from 'mongoose';

export interface Tag extends Document {
  name: string;
  description: string;
}
