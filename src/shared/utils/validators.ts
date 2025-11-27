import { z } from 'zod';
import { LogLevel, LogSource } from '@domain/entities/Log';

export const createLogSchema = z.object({
  level: z.nativeEnum(LogLevel),
  source: z.nativeEnum(LogSource),
  message: z.string().min(1).max(5000),
  metadata: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  traceId: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional()
  }).optional()
});

export const queryLogsSchema = z.object({
  level: z.nativeEnum(LogLevel).optional(),
  source: z.nativeEnum(LogSource).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  message: z.string().optional(),
  traceId: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional()
});

export function validateCreateLog(data: unknown) {
  return createLogSchema.parse(data);
}

export function validateQueryLogs(data: unknown) {
  return queryLogsSchema.parse(data);
}
