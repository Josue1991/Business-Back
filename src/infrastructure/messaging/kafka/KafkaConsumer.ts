import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { CreateLogUseCase } from '@application/usecases/CreateLog';
import { CreateLogDTO } from '@application/dto/LogDTO';

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly brokers: string[],
    private readonly clientId: string,
    private readonly groupId: string,
    private readonly topic: string,
    private readonly createLogUseCase: CreateLogUseCase
  ) {
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers
    });

    this.consumer = this.kafka.consumer({ groupId: this.groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      }
    });

    console.log(`Kafka consumer connected to topic: ${this.topic}`);
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const { message } = payload;
      const value = message.value?.toString();

      if (!value) {
        console.warn('Received empty message');
        return;
      }

      const logData: CreateLogDTO = JSON.parse(value);
      await this.createLogUseCase.execute(logData);

      console.log(`Log processed from Kafka: ${logData.message}`);
    } catch (error) {
      console.error('Error processing Kafka message:', error);
      // TODO: Implement dead letter queue
    }
  }
}
