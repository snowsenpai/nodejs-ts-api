import authRouter from './auth/auth.routes';
import userRouter from './user/user.routes';
import postRouter from './post/post.routes';
import tagRouter from './tag/tag.routes';

/**
 * Api router
 */
export default [authRouter, userRouter, postRouter, tagRouter];
