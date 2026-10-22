import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors.js';

const BODY_PARSER_ERROR_TYPES = [
  'entity.parse.failed',
  'entity.too.large',
  'charset.unsupported',
  'encoding.unsupported',
  'request.size.invalid',
];

interface BodyParserError {
  type: string;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    BODY_PARSER_ERROR_TYPES.includes((error as BodyParserError).type)
  );
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Recurso não encontrado.' });
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({ message: error.issues[0]?.message ?? 'Dados inválidos.' });
      return;
    }
    if (isBodyParserError(error)) {
      res.status(400).json({ message: 'O corpo da requisição não é um JSON válido.' });
      return;
    }
    logger.error({ err: error }, 'Falha inesperada');
    res.status(500).json({ message: 'Erro interno do servidor.' });
  };
}
