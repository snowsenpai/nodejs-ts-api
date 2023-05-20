import 'dotenv/config';
import 'module-alias/register';
import App from './app';
import mongooseConnect from '@/utils/database/mongoose';
import validateEnv from '@/utils/validateEnv';
import PostController from '@/resources/post/post.controller';
import UserController from '@/resources/user/user.controller';

validateEnv();

// promise? so app will start after db promise is resolved
// TODO findout if db connection retries will be made
mongooseConnect();

const app = new App([
    new PostController(),
    new UserController()
  ],
  Number(process.env.PORT));

// 
app.listen();
