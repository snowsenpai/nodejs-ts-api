import { authRouter } from './auth/auth.routes';
import { userRouter } from './user/user.routes';
import { postRouter } from './post/post.routes';
import { tagRouter } from './tag/tag.routes';

/**
 * Api routers
 */
export const apiRoutes = [authRouter, userRouter, postRouter, tagRouter];
