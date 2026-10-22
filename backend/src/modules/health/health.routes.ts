import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';

export function createHealthRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  });
  return router;
}
