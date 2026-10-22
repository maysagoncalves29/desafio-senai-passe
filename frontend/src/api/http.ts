const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: unknown;
}

export function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function send(
  path: string,
  { method = 'GET', query, body }: RequestOptions,
): Promise<Response> {
  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend está no ar.');
  }
}

async function failFrom(response: Response): Promise<never> {
  const payload: unknown = await response.json().catch(() => null);
  const message =
    typeof payload === 'object' && payload !== null && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : `A API respondeu com erro ${response.status}.`;
  throw new ApiError(response.status, message);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (!response.ok) return failFrom(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

export async function download(path: string, query?: QueryParams): Promise<DownloadedFile> {
  const response = await send(path, { query });
  if (!response.ok) return failFrom(response);
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'transacoes.csv';
  return { blob: await response.blob(), filename };
}
