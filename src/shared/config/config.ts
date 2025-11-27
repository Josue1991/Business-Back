import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3005'),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/business_logs',
    dbName: process.env.MONGODB_DB_NAME || 'business_logs'
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    index: process.env.ELASTICSEARCH_INDEX || 'business-logs'
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'business-log-service',
    groupId: process.env.KAFKA_GROUP_ID || 'business-log-group',
    topic: process.env.KAFKA_TOPIC_LOGS || 'business.logs'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'business_logs'
  },
  logRetention: {
    days: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
    archiveEnabled: process.env.LOG_ARCHIVE_ENABLED === 'true'
  },
  security: {
    apiKey: process.env.API_KEY || 'your-api-key-here'
  }
};
