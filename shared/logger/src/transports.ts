import { transports, format } from 'winston';
import DailyRotate from 'winston-daily-rotate-file';

const { combine, timestamp, json, colorize, printf } = format;

const consoleFormat = combine(
  colorize(),
  timestamp(),
  printf(({ level, message, timestamp, ...meta }) =>
    `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
  )
);

export const buildTransports = () => {
  const list: (transports.ConsoleTransportInstance | DailyRotate)[] = [
    new transports.Console({
      handleExceptions: true,
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.NODE_ENV === 'production' ? json() : consoleFormat
    })
  ];

  // optional file rotation when LOG_DIR is set
  if (process.env.LOG_DIR) {
    list.push(
      new DailyRotate({
        dirname: process.env.LOG_DIR,
        filename: '%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        level: 'info',
        format: json()
      })
    );
  }
  return list;
};
