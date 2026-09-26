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

// Simulated network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock database for categories
let mockCategories = [
  { id: 'cat_01h8x9p3q1m8v2n4t6w1', name: 'Raw Materials', productCount: 8, createdAt: '2026-09-26T10:00:00Z', updatedAt: '2026-09-26T10:00:00Z' },
  { id: 'cat_01h8x9p3q1m8v2n4t6w2', name: 'Finished Goods', productCount: 15, createdAt: '2026-09-26T10:10:00Z', updatedAt: '2026-09-26T10:10:00Z' },
  { id: 'cat_01h8x9p3q1m8v2n4t6w3', name: 'Packaging Supplies', productCount: 4, createdAt: '2026-09-26T10:20:00Z', updatedAt: '2026-09-26T10:20:00Z' },
  { id: 'cat_01h8x9p3q1m8v2n4t6w4', name: 'Spare Parts & Tools', productCount: 0, createdAt: '2026-09-26T10:30:00Z', updatedAt: '2026-09-26T10:30:00Z' },
];

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; message?: string; pagination?: unknown }> {
  await delay(150);

  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // POST /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const { loginId, password } = body;
    if (password === 'invalid') {
      throw new ApiError('Invalid Login Id or Password', 'INVALID_CREDENTIALS', 400);
    }
    const user = {
      id: 'usr_01h8x9p3q1m8v2n4t6w9',
      loginId: loginId || 'inventory01',
      email: `${loginId || 'user'}@stocksense.internal`,
      createdAt: '2026-09-26T10:30:00Z',
    };
    return {
      data: {
        user,
        accessToken: `jwt_mock_${Date.now()}`,
      } as unknown as T,
      message: 'Login successful',
    };
  }

  // POST /auth/signup
  if (endpoint === '/auth/signup' && method === 'POST') {
    const { loginId, email } = body;
    const user = {
      id: `usr_${Date.now().toString(36)}`,
      loginId: loginId,
      email: email,
      createdAt: new Date().toISOString(),
    };
    return {
      data: {
        user,
        accessToken: `jwt_mock_${Date.now()}`,
      } as unknown as T,
      message: 'Account created successfully',
    };
  }

  // GET /auth/me
  if (endpoint === '/auth/me' && method === 'GET') {
    const savedUser = localStorage.getItem('stocksense_user');
    if (!savedUser) {
      throw new ApiError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    return {
      data: JSON.parse(savedUser) as T,
      message: 'Success',
    };
  }

  // POST /auth/password-reset/request
  if (endpoint === '/auth/password-reset/request' && method === 'POST') {
    return {
      data: {
        message: 'If the account exists, an OTP has been sent.',
      } as unknown as T,
      message: 'OTP sent',
    };
  }

  // POST /auth/password-reset/verify
  if (endpoint === '/auth/password-reset/verify' && method === 'POST') {
    const { otp } = body;
    if (otp === '000000') {
      throw new ApiError('Invalid or expired OTP', 'INVALID_OTP', 400);
    }
    return {
      data: {
        resetToken: `reset_tok_${Date.now().toString(36)}`,
      } as unknown as T,
    };
  }

  // POST /auth/password-reset
  if (endpoint === '/auth/password-reset' && method === 'POST') {
    return {
      data: null as unknown as T,
      message: 'Password updated successfully',
    };
  }

  // POST /auth/logout
  if (endpoint === '/auth/logout' && method === 'POST') {
    return {
      data: null as unknown as T,
      message: 'Logged out successfully',
    };
  }

  // GET /categories
  if (endpoint.startsWith('/categories') && method === 'GET') {
    const urlObj = new URL(endpoint, 'http://localhost');
    const search = urlObj.searchParams.get('search')?.toLowerCase() || '';

    let filtered = [...mockCategories];
    if (search) {
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(search));
    }

    return {
      data: filtered as unknown as T,
      message: 'Success',
    };
  }

  // POST /categories
  if (endpoint === '/categories' && method === 'POST') {
    const { name } = body;
    if (!name || !name.trim()) {
      throw new ApiError('Category name is required', 'VALIDATION_ERROR', 400);
    }

    const existing = mockCategories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      throw new ApiError('A category with this name already exists', 'CONFLICT', 409);
    }

    const newCategory = {
      id: `cat_${Date.now().toString(36)}`,
      name: name.trim(),
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCategories.unshift(newCategory);

    return {
      data: newCategory as unknown as T,
      message: 'Category created successfully',
    };
  }

  // PATCH /categories/:id
  if (endpoint.startsWith('/categories/') && method === 'PATCH') {
    const categoryId = endpoint.split('/')[2]?.split('?')[0];
    const { name } = body;

    const categoryIndex = mockCategories.findIndex((c) => c.id === categoryId);
    if (categoryIndex === -1) {
      throw new ApiError('Category not found', 'NOT_FOUND', 404);
    }

    if (name && name.trim()) {
      const duplicate = mockCategories.find(
        (c) => c.id !== categoryId && c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        throw new ApiError('A category with this name already exists', 'CONFLICT', 409);
      }
      mockCategories[categoryIndex].name = name.trim();
      mockCategories[categoryIndex].updatedAt = new Date().toISOString();
    }

    return {
      data: mockCategories[categoryIndex] as unknown as T,
      message: 'Category updated successfully',
    };
  }

  // DELETE /categories/:id
  if (endpoint.startsWith('/categories/') && method === 'DELETE') {
    const categoryId = endpoint.split('/')[2]?.split('?')[0];
    const category = mockCategories.find((c) => c.id === categoryId);

    if (!category) {
      throw new ApiError('Category not found', 'NOT_FOUND', 404);
    }

    // Invariant: Category containing products cannot be deleted unless reassigned
    if (category.productCount > 0) {
      throw new ApiError(
        `Cannot delete category "${category.name}" because it contains ${category.productCount} products. Please reassign products first.`,
        'CONFLICT',
        409
      );
    }

    mockCategories = mockCategories.filter((c) => c.id !== categoryId);

    return {
      data: null as unknown as T,
      message: 'Category deleted successfully',
    };
  }

  throw new ApiError(`Endpoint ${endpoint} not found`, 'NOT_FOUND', 404);
}
