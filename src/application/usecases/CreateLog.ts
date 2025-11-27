import { ILogRepository } from '@domain/repositories/ILogRepository';
import { Log } from '@domain/entities/Log';
import { LogDomainService } from '@domain/services/LogDomainService';
import { CreateLogDTO, LogResponseDTO } from '../dto/LogDTO';

export class CreateLogUseCase {
  constructor(
    private readonly logRepository: ILogRepository,
    private readonly logDomainService: LogDomainService
  ) {}

  async execute(dto: CreateLogDTO): Promise<LogResponseDTO> {
    const log = Log.create({
      timestamp: new Date(),
      level: dto.level,
      source: dto.source,
      message: dto.message,
      metadata: dto.metadata,
      userId: dto.userId,
      sessionId: dto.sessionId,
      traceId: dto.traceId,
      ip: dto.ip,
      userAgent: dto.userAgent,
      error: dto.error
    });

    const validation = this.logDomainService.validateLog(log);
    if (!validation.valid) {
      throw new Error(`Invalid log: ${validation.errors.join(', ')}`);
    }

    await this.logRepository.save(log);

    // Check if alert should be sent
    if (this.logDomainService.shouldAlert(log)) {
      // TODO: Implement alert notification
      console.warn(`ALERT: ${log.level} from ${log.source}: ${log.message}`);
    }

    return this.mapToDTO(log);
  }

  async executeBatch(dtos: CreateLogDTO[]): Promise<LogResponseDTO[]> {
    const logs = dtos.map(dto =>
      Log.create({
        timestamp: new Date(),
        level: dto.level,
        source: dto.source,
        message: dto.message,
        metadata: dto.metadata,
        userId: dto.userId,
        sessionId: dto.sessionId,
        traceId: dto.traceId,
        ip: dto.ip,
        userAgent: dto.userAgent,
        error: dto.error
      })
    );

    // Validate all logs
    for (const log of logs) {
      const validation = this.logDomainService.validateLog(log);
      if (!validation.valid) {
        throw new Error(`Invalid log: ${validation.errors.join(', ')}`);
      }
    }

    await this.logRepository.saveBatch(logs);

    return logs.map(log => this.mapToDTO(log));
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
