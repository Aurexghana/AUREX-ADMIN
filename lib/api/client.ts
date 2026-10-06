const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:1234/api/v1";

export class ApiError extends Error {
  status: number;
  code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type ApiEnvelope<T> = { success: true; message?: string; data: T };
export type PaginatedEnvelope<T> = {
  success: true;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function parse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.message ?? "Something went wrong. Please try again.",
      res.status,
      json?.error?.code,
    );
  }
  return json as T;
}

function authHeaders(accessToken?: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; accessToken?: string | null } = {},
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(options.accessToken) },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return parse<ApiEnvelope<T>>(res);
}

export async function apiFetchPaginated<T = unknown>(
  path: string,
  options: { accessToken?: string | null } = {},
): Promise<PaginatedEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
    headers: { ...authHeaders(options.accessToken) },
  });
  return parse<PaginatedEnvelope<T>>(res);
}

export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  options: { accessToken?: string | null } = {},
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { ...authHeaders(options.accessToken) },
    body: formData,
  });
  return parse<ApiEnvelope<T>>(res);
}

export async function apiDownload(
  path: string,
  options: { accessToken?: string | null } = {},
): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
    headers: { ...authHeaders(options.accessToken) },
  });
  if (!res.ok) await parse(res);
  return res.blob();
}
