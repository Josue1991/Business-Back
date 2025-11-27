import { ILogRepository, LogQuery } from '@domain/repositories/ILogRepository';
import { QueryLogsDTO, LogQueryResultDTO, LogResponseDTO } from '../dto/LogDTO';
import { Log } from '@domain/entities/Log';

export class QueryLogsUseCase {
  constructor(private readonly logRepository: ILogRepository) {}

  async execute(dto: QueryLogsDTO): Promise<LogQueryResultDTO> {
    const query: LogQuery = {
      level: dto.level,
      source: dto.source,
      userId: dto.userId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      message: dto.message,
      traceId: dto.traceId,
      limit: dto.limit || 50,
      offset: dto.offset || 0
    };

    const result = await this.logRepository.query(query);

    return {
      logs: result.logs.map(log => this.mapToDTO(log)),
      total: result.total,
      hasMore: result.hasMore,
      limit: query.limit!,
      offset: query.offset!
    };
  }

  async getById(id: string): Promise<LogResponseDTO | null> {
    const log = await this.logRepository.findById(id);
    return log ? this.mapToDTO(log) : null;
  }

  private mapToDTO(log: Log): LogResponseDTO {
    return {
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      source: log.source,
      message: log.message,
      metadata: log.metadata,
      userId: log.userId,
      sessionId: log.sessionId,
      traceId: log.traceId,
      ip: log.ip,
      userAgent: log.userAgent,
      error: log.error
    };
  }
}
