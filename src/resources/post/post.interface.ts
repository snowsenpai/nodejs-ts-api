import { Document } from 'mongoose';

export interface Post extends Document {
  title: string;
  body: string;
  creator: string;
  tags: string[];
}
