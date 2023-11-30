import 'dotenv/config';
import 'module-alias/register';
import { App } from './app';
import { mongooseConnect } from '@/utils/database/mongoose';
import { validateEnv } from '@/utils/validate-env.utils';
import { apiRoutes } from '@/resources/index';

validateEnv();
mongooseConnect();

const app = new App(apiRoutes, Number(process.env.PORT));

app.listen();
