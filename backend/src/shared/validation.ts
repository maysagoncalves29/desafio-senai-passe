import express, { type RequestHandler, type Response } from 'express';
import { z, type ZodType } from 'zod';
import { NotFoundError, ValidationError } from './errors.js';

z.config(z.locales.pt());

export interface RequestSchemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

type Output<Schema> = Schema extends ZodType ? z.output<Schema> : undefined;

export interface ValidatedRequest<Schemas extends RequestSchemas> {
  params: Output<Schemas['params']>;
  query: Output<Schemas['query']>;
  body: Output<Schemas['body']>;
}

const jsonBody = express.json({ type: () => true, limit: '100kb' });

function describeIssue(error: z.ZodError): string {
  const issue = error.issues[0]!;
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

function parseOrThrow<T>(
  schema: ZodType<T> | undefined,
  value: unknown,
  fail: (message: string) => Error,
): T | undefined {
  if (!schema) return undefined;
  const result = schema.safeParse(value);
  if (!result.success) throw fail(describeIssue(result.error));
  return result.data;
}

// Os ids da URL são validados antes do corpo: id fora do formato conta como recurso inexistente (V8).
export function validate(schemas: RequestSchemas): RequestHandler[] {
  const parseParams: RequestHandler = (req, res, next) => {
    const params = parseOrThrow(
      schemas.params,
      req.params,
      () => new NotFoundError('Recurso não encontrado.'),
    );
    res.locals.params = params;
    next();
  };

  const parseInput: RequestHandler = (req, res, next) => {
    res.locals.validated = {
      params: res.locals.params,
      query: parseOrThrow(schemas.query, req.query, (message) => new ValidationError(message)),
      body: parseOrThrow(schemas.body, req.body, (message) => new ValidationError(message)),
    };
    next();
  };

  return [parseParams, ...(schemas.body ? [jsonBody] : []), parseInput];
}

export function validated<Schemas extends RequestSchemas>(
  res: Response,
  _schemas: Schemas,
): ValidatedRequest<Schemas> {
  return res.locals.validated as ValidatedRequest<Schemas>;
}
