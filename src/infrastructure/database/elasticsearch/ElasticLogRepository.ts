import { Client } from '@elastic/elasticsearch';
import { ILogRepository, LogQuery, LogQueryResult } from '@domain/repositories/ILogRepository';
import { Log, LogLevel, LogSource } from '@domain/entities/Log';

export class ElasticLogRepository implements ILogRepository {
  private client: Client;

  constructor(
    private readonly node: string,
    private readonly indexName: string,
    private readonly username?: string,
    private readonly password?: string
  ) {
    this.client = new Client({
      node: this.node,
      auth: username && password ? { username, password } : undefined
    });
  }

  async connect(): Promise<void> {
    // Check connection
    await this.client.ping();

    // Create index if it doesn't exist
    const exists = await this.client.indices.exists({ index: this.indexName });
    if (!exists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              timestamp: { type: 'date' },
              level: { type: 'keyword' },
              source: { type: 'keyword' },
              message: { type: 'text' },
              metadata: { type: 'object', enabled: false },
              userId: { type: 'keyword' },
              sessionId: { type: 'keyword' },
              traceId: { type: 'keyword' },
              ip: { type: 'ip' },
              userAgent: { type: 'text' },
              error: {
                properties: {
                  name: { type: 'keyword' },
                  message: { type: 'text' },
                  stack: { type: 'text' }
                }
              }
            }
          }
        }
      });
    }
  }

  async save(log: Log): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: log.id,
      document: log.toJSON()
    });
  }

  async saveBatch(logs: Log[]): Promise<void> {
    const body = logs.flatMap(log => [
      { index: { _index: this.indexName, _id: log.id } },
      log.toJSON()
    ]);

    await this.client.bulk({ body });
  }

  async findById(id: string): Promise<Log | null> {
    try {
      const result = await this.client.get({
        index: this.indexName,
        id
      });

      return this.toDomain(result._source as any);
    } catch (error: any) {
      if (error.meta?.statusCode === 404) return null;
      throw error;
    }
  }

  async query(query: LogQuery): Promise<LogQueryResult> {
    const must: any[] = [];

    if (query.level) must.push({ term: { level: query.level } });
    if (query.source) must.push({ term: { source: query.source } });
    if (query.userId) must.push({ term: { userId: query.userId } });
    if (query.traceId) must.push({ term: { traceId: query.traceId } });
    if (query.message) must.push({ match: { message: query.message } });

    if (query.startDate || query.endDate) {
      const range: any = {};
      if (query.startDate) range.gte = query.startDate.toISOString();
      if (query.endDate) range.lte = query.endDate.toISOString();
      must.push({ range: { timestamp: range } });
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const result = await this.client.search({
      index: this.indexName,
      body: {
        query: must.length > 0 ? { bool: { must } } : { match_all: {} },
        sort: [{ timestamp: { order: 'desc' } }],
        from: offset,
        size: limit
      }
    });

    const logs = result.hits.hits.map(hit => this.toDomain(hit._source as any));
    const total = typeof result.hits.total === 'number' 
      ? result.hits.total 
      : result.hits.total?.value || 0;

    return {
      logs,
      total,
      hasMore: offset + logs.length < total
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.client.deleteByQuery({
      index: this.indexName,
      body: {
        query: {
          range: {
            timestamp: { lt: date.toISOString() }
          }
        }
      }
    });

    return result.deleted || 0;
  }

  async count(query?: Partial<LogQuery>): Promise<number> {
    const must: any[] = [];

    if (query?.level) must.push({ term: { level: query.level } });
    if (query?.source) must.push({ term: { source: query.source } });

    const result = await this.client.count({
      index: this.indexName,
      body: must.length > 0 ? { query: { bool: { must } } } : undefined
    });

    return result.count;
  }

  private toDomain(source: any): Log {
    return new Log(
      source.id,
      new Date(source.timestamp),
      source.level as LogLevel,
      source.source as LogSource,
      source.message,
      source.metadata,
      source.userId,
      source.sessionId,
      source.traceId,
      source.ip,
      source.userAgent,
      source.error
    );
  }
}
