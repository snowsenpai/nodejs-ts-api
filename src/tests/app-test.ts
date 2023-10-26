import { App } from '../app';
import { apiRoutes } from '@/resources/index';

const testApp = new App(apiRoutes, Number(process.env.PORT)).express;
const appPath = '/api/v1';

const apiPaths = {
  userPath: `${appPath}/user`,
  authPath: `${appPath}/auth`,
  postPath: `${appPath}/posts`,
  tagPath: `${appPath}/tags`,
};

export { testApp, apiPaths };
