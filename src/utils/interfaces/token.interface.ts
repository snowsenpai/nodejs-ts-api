import { Schema } from 'mongoose';

export interface Token extends EncodedData{
  expiresIn: number;
}

export interface TokenData {
  token: string;
  expiresIn: number
}

export interface EncodedData extends Object{
  id?: Schema.Types.ObjectId;
  secret?: string;
}