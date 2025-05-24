import { ConsoleLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class AppLogger extends ConsoleLogger {
  private readonly logFilePath: string;
  private readonly allowedContexts: string[];

  constructor(context?: string) {
    super(context);
    this.logFilePath = path.join(process.cwd(), 'logs', 'app.log');
    this.allowedContexts = ['VideoConsumer', 'TelegramService'];
    this.ensureLogsDirectory();
  }

  log(message: any, context?: string) {
    super.log(message, context);
    this.writeToFile(message, context);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
    this.writeToFile(message, context);
  }

  error(message: any, context?: string) {
    super.error(message, context);
    this.writeToFile(message, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
    this.writeToFile(message, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);
    this.writeToFile(message, context);
  }

  private ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  }

  private writeToFile(message: any, context?: string) {
    if (!this.allowedContexts.includes(context)) return;

    const timestamp = new Date().toISOString();
    fs.appendFileSync(
      this.logFilePath,
      `[${timestamp}] ${context ? ` [${context}]` : ''} ${message}\n`,
    );
  }
}
