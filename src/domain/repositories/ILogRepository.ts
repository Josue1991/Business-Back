import { Log, LogLevel, LogSource } from '../entities/Log';

export interface LogQuery {
  level?: LogLevel;
  source?: LogSource;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  message?: string;
  traceId?: string;
  limit?: number;
  offset?: number;
}

export interface LogQueryResult {
  logs: Log[];
  total: number;
  hasMore: boolean;
}

export interface ILogRepository {
  save(log: Log): Promise<void>;
  saveBatch(logs: Log[]): Promise<void>;
  findById(id: string): Promise<Log | null>;
  query(query: LogQuery): Promise<LogQueryResult>;
  deleteOlderThan(date: Date): Promise<number>;
  count(query?: Partial<LogQuery>): Promise<number>;
}
