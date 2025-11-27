# Business-Log

Microservicio de centralización de logs para BusinessApp. Este servicio recopila, almacena y permite consultar logs de todos los microservicios del ecosistema.

## 🏗️ Arquitectura

El proyecto implementa **Arquitectura Hexagonal (Ports & Adapters)** con **Event-Driven** para procesamiento asíncrono de logs.

```
Business-Log/
├── src/
│   ├── domain/                    # Capa de dominio (lógica de negocio)
│   │   ├── entities/              # Entidades del dominio
│   │   │   └── Log.ts            # Entidad Log con niveles y metadatos
│   │   ├── repositories/          # Interfaces de repositorios
│   │   │   └── ILogRepository.ts # Contrato para persistencia
│   │   └── services/              # Servicios de dominio
│   │       └── LogDomainService.ts # Lógica de validación y estadísticas
│   │
│   ├── application/               # Capa de aplicación (casos de uso)
│   │   ├── dto/                   # Data Transfer Objects
│   │   │   └── LogDTO.ts         # DTOs para API
│   │   └── usecases/              # Casos de uso
│   │       ├── CreateLog.ts      # Crear logs (individual/batch)
│   │       ├── QueryLogs.ts      # Consultar logs
│   │       └── AnalyzeLogs.ts    # Análisis y estadísticas
│   │
│   ├── infrastructure/            # Capa de infraestructura
│   │   ├── database/              # Implementaciones de persistencia
│   │   │   ├── mongodb/
│   │   │   │   └── MongoLogRepository.ts    # Almacenamiento MongoDB
│   │   │   └── elasticsearch/
│   │   │       └── ElasticLogRepository.ts  # Búsqueda Elasticsearch
│   │   ├── messaging/             # Sistemas de mensajería
│   │   │   └── kafka/
│   │   │       └── KafkaConsumer.ts         # Consumidor Kafka
│   │   └── http/                  # API REST
│   │       └── express/
│   │           ├── routes.ts      # Rutas HTTP
│   │           └── middleware/
│   │               └── auth.middleware.ts   # Autenticación
│   │
│   ├── shared/                    # Utilidades compartidas
│   │   ├── config/
│   │   │   └── config.ts         # Configuración centralizada
│   │   ├── utils/
│   │   │   ├── logger.ts         # Logger Winston
│   │   │   └── validators.ts     # Validaciones Zod
│   │   └── errors/
│   │       └── AppError.ts       # Errores personalizados
│   │
│   └── index.ts                   # Punto de entrada
```

## 🚀 Stack Tecnológico

- **Lenguaje**: TypeScript/Node.js
- **Framework HTTP**: Express.js
- **Bases de Datos**:
  - **MongoDB**: Almacenamiento a largo plazo
  - **Elasticsearch**: Búsqueda y análisis rápido
- **Mensajería**: Kafka (procesamiento asíncrono)
- **Validación**: Zod
- **Logger**: Winston
- **Testing**: Jest

## 📋 Características

- ✅ Centralización de logs de todos los microservicios
- ✅ Múltiples niveles de log (DEBUG, INFO, WARN, ERROR, FATAL)
- ✅ Almacenamiento dual (MongoDB + Elasticsearch)
- ✅ Procesamiento asíncrono con Kafka
- ✅ API REST para consultas y análisis
- ✅ Búsqueda full-text
- ✅ Estadísticas y métricas en tiempo real
- ✅ Retención automática de logs
- ✅ Trazabilidad con traceId
- ✅ Autenticación con API Key

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu configuración
```

## ⚙️ Configuración

Edita el archivo `.env`:

```env
# Server
PORT=3005
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/business_logs
MONGODB_DB_NAME=business_logs

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
ELASTICSEARCH_INDEX=business-logs

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_LOGS=business.logs

# Security
API_KEY=your-api-key-here
```

## 🏃 Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Tests
npm test
```

## 📡 API Endpoints

### Crear Log
```http
POST /api/logs
Headers: x-api-key: your-api-key
Body:
{
  "level": "INFO",
  "source": "Business-Gateway",
  "message": "Usuario autenticado correctamente",
  "userId": "123",
  "traceId": "abc-xyz"
}
```

### Crear Batch de Logs
```http
POST /api/logs/batch
Headers: x-api-key: your-api-key
Body: [{ log1 }, { log2 }, ...]
```

### Consultar Logs
```http
GET /api/logs?level=ERROR&source=Business-Security&limit=50
Headers: x-api-key: your-api-key
```

### Obtener Log por ID
```http
GET /api/logs/:id
Headers: x-api-key: your-api-key
```

### Estadísticas
```http
GET /api/logs/analytics/statistics?startDate=2025-01-01
Headers: x-api-key: your-api-key
```

### Tasa de Errores
```http
GET /api/logs/analytics/error-rate?hours=24
Headers: x-api-key: your-api-key
```

### Limpiar Logs Antiguos
```http
DELETE /api/logs/cleanup?days=30
Headers: x-api-key: your-api-key
```

### Health Check
```http
GET /health
```

## 🔄 Flujo de Logs

1. **Microservicio** genera un log
2. **Kafka Producer** envía el log al topic `business.logs`
3. **Kafka Consumer** procesa el mensaje
4. **Caso de Uso** valida y procesa el log
5. **MongoDB** almacena el log
6. **Elasticsearch** indexa para búsqueda rápida

## 📊 Niveles de Log

- `DEBUG`: Información detallada para debugging
- `INFO`: Eventos informativos normales
- `WARN`: Advertencias que no afectan la operación
- `ERROR`: Errores que afectan una operación
- `FATAL`: Errores críticos que requieren atención inmediata

## 🔍 Fuentes de Log

- `Business-Gateway`: API Gateway
- `Business-Security`: Servicio de autenticación
- `Business-Licensing`: Sistema de licencias
- `Business-FrontEnd`: Aplicación frontend
- `Business-Mensajeria`: Servicio de mensajería
- `Business-Notificaciones`: Sistema de notificaciones
- `Business-Report`: Generación de reportes
- `Business-Log`: Este servicio

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📦 Despliegue

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Kubernetes
- Deployment con 3 réplicas
- Service ClusterIP
- ConfigMap para configuración
- Secret para credenciales

## 🔐 Seguridad

- Autenticación con API Key
- CORS configurado
- Helmet para seguridad HTTP
- Validación de datos con Zod
- Rate limiting (recomendado)

## 📈 Monitoreo

- Health check endpoint: `/health`
- Métricas de logs procesados
- Tasa de errores en tiempo real
- Estadísticas por fuente

## 🤝 Integración

### Desde otros microservicios (Node.js):
```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
await producer.send({
  topic: 'business.logs',
  messages: [{
    value: JSON.stringify({
      level: 'INFO',
      source: 'Business-Gateway',
      message: 'Request procesado',
      traceId: 'xyz'
    })
  }]
});
```

### Desde Python (Business-Security):
```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

producer.send('business.logs', {
    'level': 'INFO',
    'source': 'Business-Security',
    'message': 'Usuario autenticado',
    'userId': '123'
})
```

## 📝 Licencia

Privado - BusinessApp

## 👥 Autor

BusinessApp Development Team
