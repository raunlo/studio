/**
 * Logger utility for consistent logging across the application.
 * 
 * Features:
 * - Development: All log levels are available (debug, info, warn, error)
 * - Production: Only warnings and errors are logged
 * - Test: All logs are suppressed
 * - Timestamps: All logs include ISO 8601 timestamps
 * - Prefixes: Optional context prefixes for better log organization
 * 
 * Usage:
 * ```typescript
 * import { createLogger, logger } from '@/lib/logger';
 * 
 * // Use default logger
 * logger.info('Application started');
 * logger.error('An error occurred', error);
 * 
 * // Create a logger with context prefix
 * const dbLogger = createLogger('Database');
 * dbLogger.debug('Query executed', { query, duration });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Logger class for structured logging with context
 */
class Logger {
  private prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix;
  }

  /**
   * Internal method to format and output log messages
   * @param level - Log level (debug, info, warn, error)
   * @param message - Main log message
   * @param args - Additional arguments to log
   */
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

  /**
   * Log debug information (development only)
   * @param message - Debug message
   * @param args - Additional data to log
   */
  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  /**
   * Log informational messages (development only)
   * @param message - Info message
   * @param args - Additional data to log
   */
  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  /**
   * Log warning messages (all environments except test)
   * @param message - Warning message
   * @param args - Additional data to log
   */
  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  /**
   * Log error messages (all environments except test)
   * @param message - Error message
   * @param args - Additional data to log (e.g., error objects, stack traces)
   */
  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }
}

/**
 * Create a logger instance with an optional prefix
 * @param prefix - Optional prefix to add to all log messages (e.g., 'API', 'Database')
 * @returns Logger instance
 * 
 * @example
 * const apiLogger = createLogger('API');
 * apiLogger.info('Request received', { method: 'GET', path: '/users' });
 */
export function createLogger(prefix?: string): Logger {
  return new Logger(prefix);
}

/**
 * Default logger instance without prefix
 * Use this for general application logging
 */
export const logger = createLogger();
