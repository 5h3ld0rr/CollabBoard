const BASE = import.meta.env.VITE_API_URL ?? '';

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: ApiErrorDetail[];

  constructor(message: string, status: number, code = 'API_ERROR', details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const errorBody = await res.json();
    const errorInfo = errorBody.error || errorBody;
    return new ApiError(
      errorInfo.message || `Request failed with status ${res.status}`,
      res.status,
      errorInfo.code || 'UNKNOWN_ERROR',
      errorInfo.details
    );
  } catch {
    return new ApiError(`HTTP Error ${res.status}: ${res.statusText}`, res.status);
  }
}

/**
 * Universal HTTP client sending Bearer JWT token and handling centralized errors & 401 expiration
 */
export async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(BASE + path, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:expired'));
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.status === 204 ? (null as T) : res.json();
}
