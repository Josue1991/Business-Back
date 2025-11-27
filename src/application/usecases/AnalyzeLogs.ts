import { ILogRepository } from '@domain/repositories/ILogRepository';
import { LogDomainService, LogStatistics } from '@domain/services/LogDomainService';

export interface AnalyticsQuery {
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AnalyzeLogsUseCase {
  constructor(
    private readonly logRepository: ILogRepository,
    private readonly logDomainService: LogDomainService
  ) {}

  async getStatistics(query: AnalyticsQuery): Promise<LogStatistics> {
    const result = await this.logRepository.query({
      source: query.source as any,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: 10000 // Large limit for statistics
    });

    return this.logDomainService.calculateStatistics(result.logs);
  }

  async cleanOldLogs(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return this.logRepository.deleteOlderThan(cutoffDate);
  }

  async getErrorRate(hours: number = 24): Promise<number> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const result = await this.logRepository.query({
      startDate,
      limit: 10000
    });

    const stats = await this.logDomainService.calculateStatistics(result.logs);
    return stats.errorRate;
  }
}
