const BASE = import.meta.env.VITE_API_URL ?? '';

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code = 'API_ERROR', details?: any) {
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
    let message = errorInfo.message || `Request failed with status ${res.status}`;
    if (errorInfo.details && Array.isArray(errorInfo.details) && errorInfo.details.length > 0) {
      const detailedMessages = errorInfo.details
        .map((d: any) => d.message || d.field)
        .filter(Boolean);
      if (detailedMessages.length > 0) {
        message = detailedMessages.join('. ');
      }
    }
    return new ApiError(
      message,
      res.status,
      errorInfo.code || 'UNKNOWN_ERROR',
      errorInfo.details
    );
  } catch {
    return new ApiError(`HTTP Error ${res.status}: ${res.statusText}`, res.status);
  }
}

/**
 * Universal HTTP client relying on HTTP-only cookies and handling centralized errors & 401 expiration
 */
export async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(BASE + path, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  return res.status === 204 ? (null as T) : res.json();
}
