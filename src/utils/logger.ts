import pino from "pino";

const logger = pino(
  {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
        ignore: 'pid,hostname'
      }
    },
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  },
  pino.destination(`${__dirname}/app.log`)
);

export default logger;