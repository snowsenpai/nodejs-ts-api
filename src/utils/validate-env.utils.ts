import { cleanEnv, str, port } from 'envalid';

function validateEnv(): void {
  cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['development', 'production', 'test'],
    }),
    PORT: port({ default: 3000 }),
    MONGO_PATH: str(),
    MONGO_DATABASE: str(),
    MONGO_USER: str(),
    MONGO_PASSWORD: str(),
    JWT_SECRET: str(),
    APP_NAME: str(),
    APP_EMAIL: str(),
    SECRET_CHARACTERS: str(),
    SENDGRID_API_KEY: str(),
    SECRET_KEY: str(),
    SECRET_IV: str(),
    USER_SECRET_TOKEN_LENGTH: str(),
  });
}

export default validateEnv;
