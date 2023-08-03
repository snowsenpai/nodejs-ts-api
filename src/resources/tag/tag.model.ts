import { Schema, model } from "mongoose";
import Tag from "./tag.interface";

const TagSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true
  }
  }, {
    timestamps: true,
  }
);

export default model<Tag>('Tag', TagSchema);