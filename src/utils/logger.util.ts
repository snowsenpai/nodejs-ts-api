import pino from 'pino';
import path from 'path';

//issue: open handler detected by jest from pino.transport(
const transport = pino.transport({
  targets: [
    {
      target: path.resolve('dist/utils/transport-stream.js'),
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

const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);

export default logger;
