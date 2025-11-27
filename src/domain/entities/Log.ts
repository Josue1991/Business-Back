export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogSource {
  GATEWAY = 'Business-Gateway',
  SECURITY = 'Business-Security',
  LICENSING = 'Business-Licensing',
  FRONTEND = 'Business-FrontEnd',
  MESSAGING = 'Business-Mensajeria',
  NOTIFICATIONS = 'Business-Notificaciones',
  REPORTS = 'Business-Report',
  LOG = 'Business-Log'
}

export interface LogMetadata {
  [key: string]: any;
}

export class Log {
  constructor(
    public readonly id: string,
    public readonly timestamp: Date,
    public readonly level: LogLevel,
    public readonly source: LogSource,
    public readonly message: string,
    public readonly metadata?: LogMetadata,
    public readonly userId?: string,
    public readonly sessionId?: string,
    public readonly traceId?: string,
    public readonly ip?: string,
    public readonly userAgent?: string,
    public readonly error?: {
      name: string;
      message: string;
      stack?: string;
    }
  ) {}

  static create(params: {
    timestamp: Date;
    level: LogLevel;
    source: LogSource;
    message: string;
    metadata?: LogMetadata;
    userId?: string;
    sessionId?: string;
    traceId?: string;
    ip?: string;
    userAgent?: string;
    error?: {
      name: string;
      message: string;
      stack?: string;
    };
  }): Log {
    const id = this.generateId();
    return new Log(
      id,
      params.timestamp,
      params.level,
      params.source,
      params.message,
      params.metadata,
      params.userId,
      params.sessionId,
      params.traceId,
      params.ip,
      params.userAgent,
      params.error
    );
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isError(): boolean {
    return this.level === LogLevel.ERROR || this.level === LogLevel.FATAL;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      level: this.level,
      source: this.source,
      message: this.message,
      metadata: this.metadata,
      userId: this.userId,
      sessionId: this.sessionId,
      traceId: this.traceId,
      ip: this.ip,
      userAgent: this.userAgent,
      error: this.error
    };
  }
}
