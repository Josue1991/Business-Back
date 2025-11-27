import { MongoClient, Db, Collection } from 'mongodb';
import { ILogRepository, LogQuery, LogQueryResult } from '@domain/repositories/ILogRepository';
import { Log, LogLevel, LogSource } from '@domain/entities/Log';

interface LogDocument {
  _id: string;
  timestamp: Date;
  level: string;
  source: string;
  message: string;
  metadata?: any;
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

export class MongoLogRepository implements ILogRepository {
  private db: Db | null = null;
  private collection: Collection<LogDocument> | null = null;

  constructor(
    private readonly connectionString: string,
    private readonly dbName: string
  ) {}

  async connect(): Promise<void> {
    const client = await MongoClient.connect(this.connectionString);
    this.db = client.db(this.dbName);
    this.collection = this.db.collection<LogDocument>('logs');

    // Create indexes
    await this.collection.createIndex({ timestamp: -1 });
    await this.collection.createIndex({ level: 1 });
    await this.collection.createIndex({ source: 1 });
    await this.collection.createIndex({ userId: 1 });
    await this.collection.createIndex({ traceId: 1 });
  }

  async save(log: Log): Promise<void> {
    if (!this.collection) throw new Error('Database not connected');

    const document = this.toDocument(log);
    await this.collection.insertOne(document);
  }

  async saveBatch(logs: Log[]): Promise<void> {
    if (!this.collection) throw new Error('Database not connected');

    const documents = logs.map(log => this.toDocument(log));
    await this.collection.insertMany(documents);
  }

  async findById(id: string): Promise<Log | null> {
    if (!this.collection) throw new Error('Database not connected');

    const document = await this.collection.findOne({ _id: id });
    return document ? this.toDomain(document) : null;
  }

  async query(query: LogQuery): Promise<LogQueryResult> {
    if (!this.collection) throw new Error('Database not connected');

    const filter: any = {};

    if (query.level) filter.level = query.level;
    if (query.source) filter.source = query.source;
    if (query.userId) filter.userId = query.userId;
    if (query.traceId) filter.traceId = query.traceId;
    if (query.message) filter.message = { $regex: query.message, $options: 'i' };

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = query.startDate;
      if (query.endDate) filter.timestamp.$lte = query.endDate;
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [documents, total] = await Promise.all([
      this.collection
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(filter)
    ]);

    const logs = documents.map(doc => this.toDomain(doc));

    return {
      logs,
      total,
      hasMore: offset + documents.length < total
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    if (!this.collection) throw new Error('Database not connected');

    const result = await this.collection.deleteMany({
      timestamp: { $lt: date }
    });

    return result.deletedCount;
  }

  async count(query?: Partial<LogQuery>): Promise<number> {
    if (!this.collection) throw new Error('Database not connected');

    const filter: any = {};
    if (query?.level) filter.level = query.level;
    if (query?.source) filter.source = query.source;

    return this.collection.countDocuments(filter);
  }

  private toDocument(log: Log): LogDocument {
    return {
      _id: log.id,
      timestamp: log.timestamp,
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

  private toDomain(document: LogDocument): Log {
    return new Log(
      document._id,
      document.timestamp,
      document.level as LogLevel,
      document.source as LogSource,
      document.message,
      document.metadata,
      document.userId,
      document.sessionId,
      document.traceId,
      document.ip,
      document.userAgent,
      document.error
    );
  }
}
