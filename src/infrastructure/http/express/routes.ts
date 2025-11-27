import { Router, Request, Response } from 'express';
import { CreateLogUseCase } from '@application/usecases/CreateLog';
import { QueryLogsUseCase } from '@application/usecases/QueryLogs';
import { AnalyzeLogsUseCase } from '@application/usecases/AnalyzeLogs';
import { CreateLogDTO, QueryLogsDTO } from '@application/dto/LogDTO';

export function createLogRoutes(
  createLogUseCase: CreateLogUseCase,
  queryLogsUseCase: QueryLogsUseCase,
  analyzeLogsUseCase: AnalyzeLogsUseCase
): Router {
  const router = Router();

  // Create single log
  router.post('/', async (req: Request, res: Response) => {
    try {
      const dto: CreateLogDTO = req.body;
      const result = await createLogUseCase.execute(dto);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create batch logs
  router.post('/batch', async (req: Request, res: Response) => {
    try {
      const dtos: CreateLogDTO[] = req.body;
      const result = await createLogUseCase.executeBatch(dtos);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Query logs
  router.get('/', async (req: Request, res: Response) => {
    try {
      const dto: QueryLogsDTO = {
        level: req.query.level as any,
        source: req.query.source as any,
        userId: req.query.userId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        message: req.query.message as string,
        traceId: req.query.traceId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const result = await queryLogsUseCase.execute(dto);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get log by ID
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await queryLogsUseCase.getById(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Log not found' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get statistics
  router.get('/analytics/statistics', async (req: Request, res: Response) => {
    try {
      const query = {
        source: req.query.source as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const result = await analyzeLogsUseCase.getStatistics(query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get error rate
  router.get('/analytics/error-rate', async (req: Request, res: Response) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const errorRate = await analyzeLogsUseCase.getErrorRate(hours);
      res.json({ errorRate, hours });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Clean old logs
  router.delete('/cleanup', async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const deleted = await analyzeLogsUseCase.cleanOldLogs(days);
      res.json({ deleted, days });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
