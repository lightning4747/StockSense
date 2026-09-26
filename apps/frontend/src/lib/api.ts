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

// Mock fallback handler for standalone frontend development before backend runs
function handleMockAuth<T>(endpoint: string, options: RequestInit): { data: T; message?: string } | null {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Mock /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const { loginId, password } = body;
    if (password === 'invalid') {
      throw new ApiError('Invalid Login Id or Password', 'INVALID_CREDENTIALS', 400);
    }
    const user = {
      id: 'mock-user-uuid-001',
      loginId: loginId || 'inventory01',
      email: `${loginId || 'user'}@stocksense.internal`,
      createdAt: new Date().toISOString(),
    };
    return {
      data: {
        user,
        accessToken: `mock_jwt_token_${Date.now()}`,
      } as unknown as T,
      message: 'Login successful',
    };
  }

  // Mock /auth/signup
  if (endpoint === '/auth/signup' && method === 'POST') {
    const { loginId, email } = body;
    const user = {
      id: 'mock-user-uuid-new',
      loginId: loginId || 'inventory01',
      email: email || 'user@example.com',
      createdAt: new Date().toISOString(),
    };
    return {
      data: {
        user,
        accessToken: `mock_jwt_token_${Date.now()}`,
      } as unknown as T,
      message: 'Account created successfully',
    };
  }

  // Mock /auth/me
  if (endpoint === '/auth/me' && method === 'GET') {
    const savedUserStr = localStorage.getItem('stocksense_user');
    const user = savedUserStr
      ? JSON.parse(savedUserStr)
      : {
          id: 'mock-user-uuid-001',
          loginId: 'inventory01',
          email: 'admin@stocksense.internal',
          createdAt: new Date().toISOString(),
        };
    return {
      data: user as unknown as T,
      message: 'Success',
    };
  }

  // Mock /auth/password-reset/request
  if (endpoint === '/auth/password-reset/request' && method === 'POST') {
    return {
      data: {
        message: 'If the account exists, an OTP has been sent.',
      } as unknown as T,
    };
  }

  // Mock /auth/password-reset/verify
  if (endpoint === '/auth/password-reset/verify' && method === 'POST') {
    const { otp } = body;
    if (otp !== '123456') {
      // In dev, accept 123456 or allow any 6 digit except 000000
      if (otp === '000000') {
        throw new ApiError('Invalid or expired OTP', 'INVALID_OTP', 400);
      }
    }
    return {
      data: {
        resetToken: `mock_reset_token_${Date.now()}`,
      } as unknown as T,
    };
  }

  // Mock /auth/password-reset
  if (endpoint === '/auth/password-reset' && method === 'POST') {
    return {
      data: null as unknown as T,
      message: 'Password updated successfully',
    };
  }

  // Mock /auth/logout
  if (endpoint === '/auth/logout' && method === 'POST') {
    return {
      data: null as unknown as T,
      message: 'Logged out successfully',
    };
  }

  return null;
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

  try {
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
  } catch (error) {
    // If backend server is not running or network request fails, seamlessly use mock responses
    if (
      error instanceof TypeError &&
      (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))
    ) {
      const mockResult = handleMockAuth<T>(endpoint, options);
      if (mockResult) {
        return mockResult;
      }
    }
    throw error;
  }
}
