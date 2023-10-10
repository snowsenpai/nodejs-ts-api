import App from '../app';
import apiRoutes from '@/resources/index';

const testApp = new App(apiRoutes, Number(process.env.PORT)).express;
const appPath = '/api/v1';
export { testApp, appPath };
