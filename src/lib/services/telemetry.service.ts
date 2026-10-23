'use client';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface TelemetryLog {
  id: string;
  correlationId: string;
  timestamp: string;
  level: LogLevel;
  category: 'AUTH' | 'LOYALTY' | 'PHOTOBOOTH' | 'BILLING' | 'WALL' | 'NETWORK' | 'SECURITY';
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export class TelemetryService {
  private static logs: TelemetryLog[] = [];
  private static breadcrumbs: string[] = [];
  private static maxLogs = 200;

  public static generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public static addBreadcrumb(action: string): void {
    this.breadcrumbs.push(`[${new Date().toISOString()}] ${action}`);
    if (this.breadcrumbs.length > 50) this.breadcrumbs.shift();
  }

  public static log(
    level: LogLevel,
    category: TelemetryLog['category'],
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): TelemetryLog {
    const entry: TelemetryLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      correlationId: (context?.correlationId as string) || this.generateCorrelationId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: {
        ...context,
        breadcrumbs: [...this.breadcrumbs.slice(-5)],
      },
      stack: error?.stack,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) this.logs.pop();

    if (level === 'ERROR' || level === 'FATAL') {
      // In development or test, log structured error
      if (typeof console !== 'undefined') {
        console.error(`[TELEMETRY][${level}][${category}] ${message}`, entry);
      }
    }

    return entry;
  }

  public static captureException(
    error: unknown,
    category: TelemetryLog['category'] = 'NETWORK',
    context?: Record<string, unknown>
  ): TelemetryLog {
    const err = error instanceof Error ? error : new Error(String(error));
    return this.log('ERROR', category, err.message, context, err);
  }

  public static getRecentLogs(limit = 50): TelemetryLog[] {
    return this.logs.slice(0, limit);
  }

  public static clearLogs(): void {
    this.logs = [];
    this.breadcrumbs = [];
  }
}
