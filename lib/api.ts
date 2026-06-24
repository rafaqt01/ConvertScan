import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiErrorCode =
  | 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'
  | 'RATE_LIMITED' | 'INTERNAL' | 'VALIDATION';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message: string, public status = 400, public details?: unknown) {
    super(message);
  }
}

export function apiError(code: ApiErrorCode, message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) return apiError(err.code, err.message, err.status, err.details);
  if (err instanceof ZodError) return apiError('VALIDATION', 'Dados inválidos', 422, err.flatten());
  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') return apiError('UNAUTHORIZED', 'Não autorizado', 401);
    return apiError('INTERNAL', err.message, 500);
  }
  return apiError('INTERNAL', 'Erro interno', 500);
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function paginated<T>(items: T[], total: number, page: number, perPage: number) {
  return NextResponse.json({ data: items, meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) } });
}
