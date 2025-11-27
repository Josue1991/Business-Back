import { Log, LogLevel } from '../entities/Log';

export interface LogStatistics {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  bySource: Record<string, number>;
  errorRate: number;
}

export class LogDomainService {
  async calculateStatistics(logs: Log[]): Promise<LogStatistics> {
    const totalLogs = logs.length;
    const errorCount = logs.filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL).length;
    const warnCount = logs.filter(log => log.level === LogLevel.WARN).length;
    const infoCount = logs.filter(log => log.level === LogLevel.INFO).length;

    const bySource: Record<string, number> = {};
    logs.forEach(log => {
      bySource[log.source] = (bySource[log.source] || 0) + 1;
    });

    const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

    return {
      totalLogs,
      errorCount,
      warnCount,
      infoCount,
      bySource,
      errorRate
    };
  }

  validateLog(log: Log): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!log.message || log.message.trim() === '') {
      errors.push('Message cannot be empty');
    }

    if (!log.source) {
      errors.push('Source is required');
    }

    if (!log.level) {
      errors.push('Level is required');
    }

    if (!log.timestamp) {
      errors.push('Timestamp is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  shouldAlert(log: Log): boolean {
    return log.level === LogLevel.ERROR || log.level === LogLevel.FATAL;
  }
}
