import { loadEnvironment } from './config/environment.js';
import { createApp } from './app.js';
import { createLogger } from './infra/logger.js';
import { createPrismaClient } from './infra/prisma.js';
import { systemClock } from './shared/clock.js';

const environment = loadEnvironment();
const logger = createLogger(environment.LOG_LEVEL);
const prisma = createPrismaClient(environment.DATABASE_URL);

const app = createApp({
  prisma,
  clock: systemClock,
  logger,
  frontendOrigin: environment.FRONTEND_ORIGIN,
});

const server = app.listen(environment.PORT, () => {
  logger.info(`API disponível em http://localhost:${environment.PORT}/api/v1`);
  logger.info(`Documentação em http://localhost:${environment.PORT}/docs`);
});

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
