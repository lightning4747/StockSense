const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  status: number;

  constructor(message: string, code: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; message?: string; pagination?: unknown }> {
  const token = localStorage.getItem('stocksense_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorData = body as ApiErrorResponse | null;
    const errorCode = errorData?.error?.code || 'API_ERROR';
    const errorMessage = errorData?.error?.message || response.statusText || 'An error occurred';
    throw new ApiError(errorMessage, errorCode, response.status, errorData?.error?.details);
  }

  return body;
}
