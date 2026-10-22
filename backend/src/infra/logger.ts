import pino, { type Logger } from 'pino';

export function createLogger(level: string): Logger {
  if (level === 'silent') return pino({ level });
  return pino({
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: false,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: true,
      },
    },
  });
}
