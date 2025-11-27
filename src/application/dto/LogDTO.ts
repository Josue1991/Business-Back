import { LogLevel, LogSource } from '@domain/entities/Log';

export interface CreateLogDTO {
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, any>;
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
}

export interface QueryLogsDTO {
  level?: LogLevel;
  source?: LogSource;
  userId?: string;
  startDate?: string;
  endDate?: string;
  message?: string;
  traceId?: string;
  limit?: number;
  offset?: number;
}

export interface LogResponseDTO {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, any>;
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
}

export interface LogQueryResultDTO {
  logs: LogResponseDTO[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}
