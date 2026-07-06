/**
 * Winston logger configuration.
 *
 * @module logger
 */
const { createLogger, format, transports } = require('winston');
const config = require('../config/env');

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new transports.Console({
      format:
        config.NODE_ENV === 'production'
          ? format.combine(format.colorize(), format.simple())
          : format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;
