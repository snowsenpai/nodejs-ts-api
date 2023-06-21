import pino from "pino";

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: `./logs/app.log` },
      level: 'info'
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
        ignore: 'pid,hostname'
      },
      level: 'info'
    }
  ]
});

const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
);

export default logger;