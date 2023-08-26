import { Schema, model } from 'mongoose';
import Post from './post.interface';

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

PostSchema.post('save', async function (doc, next) {
  await doc.populate('tags', 'name');
  next();
});

PostSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate('tags', 'name');
  next();
});

export default model<Post>('Post', PostSchema);
