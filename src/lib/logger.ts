/**
 * Logger utility for consistent logging across the application
 * In production, only errors are logged. In development, all levels are available.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

class Logger {
  private prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}] ` : '';
    
    if (isTest) {
      // Suppress logs in test environment
      return;
    }

    switch (level) {
      case 'debug':
        if (isDevelopment) {
          console.debug(`${timestamp} ${prefixStr}${message}`, ...args);
        }
        break;
      case 'info':
        if (isDevelopment) {
          console.info(`${timestamp} ${prefixStr}${message}`, ...args);
        }
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefixStr}${message}`, ...args);
        break;
      case 'error':
        console.error(`${timestamp} ${prefixStr}${message}`, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }
}

/**
 * Create a logger instance with an optional prefix
 * @param prefix - Optional prefix to add to all log messages
 * @returns Logger instance
 */
export function createLogger(prefix?: string): Logger {
  return new Logger(prefix);
}

// Default logger instance
export const logger = createLogger();
