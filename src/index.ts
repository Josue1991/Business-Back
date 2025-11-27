import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from '@shared/config/config';
import { logger } from '@shared/utils/logger';
import { MongoLogRepository } from '@infrastructure/database/mongodb/MongoLogRepository';
import { ElasticLogRepository } from '@infrastructure/database/elasticsearch/ElasticLogRepository';
import { LogDomainService } from '@domain/services/LogDomainService';
import { CreateLogUseCase } from '@application/usecases/CreateLog';
import { QueryLogsUseCase } from '@application/usecases/QueryLogs';
import { AnalyzeLogsUseCase } from '@application/usecases/AnalyzeLogs';
import { createLogRoutes } from '@infrastructure/http/express/routes';
import { authMiddleware } from '@infrastructure/http/express/middleware/auth.middleware';
import { KafkaConsumer } from '@infrastructure/messaging/kafka/KafkaConsumer';

class Server {
  private app: Application;
  private mongoRepository!: MongoLogRepository;
  private elasticRepository!: ElasticLogRepository;
  private kafkaConsumer!: KafkaConsumer;

  constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({ origin: config.server.corsOrigin }));
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logger
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });
  }

  private async initializeRepositories(): Promise<void> {
    // MongoDB repository
    this.mongoRepository = new MongoLogRepository(
      config.mongodb.uri,
      config.mongodb.dbName
    );
    await this.mongoRepository.connect();
    logger.info('MongoDB connected');

    // Elasticsearch repository
    this.elasticRepository = new ElasticLogRepository(
      config.elasticsearch.node,
      config.elasticsearch.index,
      config.elasticsearch.username,
      config.elasticsearch.password
    );
    await this.elasticRepository.connect();
    logger.info('Elasticsearch connected');
  }

  private setupRoutes(): void {
    const logDomainService = new LogDomainService();
    
    // Use Elasticsearch for queries (fast search) and MongoDB for storage
    const createLogUseCase = new CreateLogUseCase(
      this.mongoRepository,
      logDomainService
    );
    const queryLogsUseCase = new QueryLogsUseCase(this.elasticRepository);
    const analyzeLogsUseCase = new AnalyzeLogsUseCase(
      this.elasticRepository,
      logDomainService
    );

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Log routes
    this.app.use('/api/logs', authMiddleware, createLogRoutes(
      createLogUseCase,
      queryLogsUseCase,
      analyzeLogsUseCase
    ));

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger.error('Error:', err);
      res.status(err.statusCode || 500).json({
        error: err.message || 'Internal server error'
      });
    });
  }

  private async initializeKafkaConsumer(): Promise<void> {
    const logDomainService = new LogDomainService();
    const createLogUseCase = new CreateLogUseCase(
      this.mongoRepository,
      logDomainService
    );

    this.kafkaConsumer = new KafkaConsumer(
      config.kafka.brokers,
      config.kafka.clientId,
      config.kafka.groupId,
      config.kafka.topic,
      createLogUseCase
    );

    await this.kafkaConsumer.connect();
    logger.info('Kafka consumer connected');
  }

  public async start(): Promise<void> {
    try {
      await this.initializeRepositories();
      this.setupRoutes();

      // Optional: Initialize Kafka consumer
      if (config.kafka.brokers.length > 0) {
        try {
          await this.initializeKafkaConsumer();
        } catch (error) {
          logger.warn('Kafka consumer not initialized:', error);
        }
      }

      const port = config.server.port;
      this.app.listen(port, () => {
        logger.info(`Business-Log service running on port ${port}`);
        logger.info(`Environment: ${config.server.nodeEnv}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    if (this.kafkaConsumer) {
      await this.kafkaConsumer.disconnect();
    }
    logger.info('Server stopped');
  }
}

// Start server
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});
