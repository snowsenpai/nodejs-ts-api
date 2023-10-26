import pino from 'pino';
import path from 'path';

const transport = pino.transport({
  targets: [
    {
      target: path.resolve('dist/utils/transport-stream.util.js'),
      options: {
        fileName: 'app.log',
        destination: path.resolve('logs'),
        interval: '7d',
        compress: true,
        size: '300K',
      },
      level: 'info',
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
        ignore: 'pid,hostname',
      },
      level: 'info',
    },
  ],
});

export const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);
