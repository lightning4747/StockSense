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

// In-memory mock database for warehouses
let mockWarehouses = [
  {
    id: 'wh_01h8x9p3q1m8v2n4t6w1',
    name: 'Main Warehouse',
    shortCode: 'WH',
    address: 'Building A, Industrial Area, Sector 5',
    locationCount: 2,
    createdAt: '2026-09-26T10:00:00Z',
    updatedAt: '2026-09-26T10:00:00Z',
  },
  {
    id: 'wh_01h8x9p3q1m8v2n4t6w2',
    name: 'Production Facility',
    shortCode: 'PROD',
    address: 'Plant 2, Fabrication Complex',
    locationCount: 2,
    createdAt: '2026-09-26T10:15:00Z',
    updatedAt: '2026-09-26T10:15:00Z',
  },
  {
    id: 'wh_01h8x9p3q1m8v2n4t6w3',
    name: 'North Regional Depot',
    shortCode: 'NORTH',
    address: 'Logistics Park, Gate 3',
    locationCount: 0,
    createdAt: '2026-09-26T10:30:00Z',
    updatedAt: '2026-09-26T10:30:00Z',
  },
];

// In-memory mock database for locations
let mockLocations = [
  {
    id: 'loc_01h8x9p3q1m8v2n4t6w1',
    name: 'Stock',
    shortCode: 'STOCK',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    createdAt: '2026-09-26T10:05:00Z',
    updatedAt: '2026-09-26T10:05:00Z',
  },
  {
    id: 'loc_01h8x9p3q1m8v2n4t6w2',
    name: 'Receiving Dock',
    shortCode: 'REC',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    createdAt: '2026-09-26T10:10:00Z',
    updatedAt: '2026-09-26T10:10:00Z',
  },
  {
    id: 'loc_01h8x9p3q1m8v2n4t6w3',
    name: 'Assembly Rack 1',
    shortCode: 'RACK1',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w2',
    createdAt: '2026-09-26T10:20:00Z',
    updatedAt: '2026-09-26T10:20:00Z',
  },
  {
    id: 'loc_01h8x9p3q1m8v2n4t6w4',
    name: 'Finishing Line',
    shortCode: 'FINISH',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w2',
    createdAt: '2026-09-26T10:25:00Z',
    updatedAt: '2026-09-26T10:25:00Z',
  },
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

  // ==========================================
  // WAREHOUSES ENDPOINTS (API Contract §11)
  // ==========================================

  // GET /warehouses
  if (endpoint.startsWith('/warehouses') && !endpoint.includes('/locations') && method === 'GET') {
    const parts = endpoint.split('/');
    if (parts.length > 2 && parts[2]) {
      const warehouseId = parts[2].split('?')[0];
      const wh = mockWarehouses.find((w) => w.id === warehouseId);
      if (!wh) {
        throw new ApiError('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404);
      }
      return {
        data: wh as unknown as T,
        message: 'Success',
      };
    }

    const urlObj = new URL(endpoint, 'http://localhost');
    const search = urlObj.searchParams.get('search')?.toLowerCase() || '';

    let filtered = [...mockWarehouses];
    if (search) {
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(search) ||
          w.shortCode.toLowerCase().includes(search) ||
          (w.address && w.address.toLowerCase().includes(search))
      );
    }

    // Refresh live locationCount
    filtered = filtered.map((w) => ({
      ...w,
      locationCount: mockLocations.filter((l) => l.warehouseId === w.id).length,
    }));

    return {
      data: filtered as unknown as T,
      message: 'Success',
    };
  }

  // POST /warehouses
  if (endpoint === '/warehouses' && method === 'POST') {
    const { name, shortCode, address } = body;
    if (!name || !name.trim()) {
      throw new ApiError('Warehouse name is required', 'VALIDATION_ERROR', 400);
    }
    if (!shortCode || !shortCode.trim()) {
      throw new ApiError('Short code is required', 'VALIDATION_ERROR', 400);
    }

    const code = shortCode.trim().toUpperCase();
    const existing = mockWarehouses.find((w) => w.shortCode.toUpperCase() === code);
    if (existing) {
      throw new ApiError('A warehouse with this short code already exists', 'CONFLICT', 409);
    }

    const newWh = {
      id: `wh_${Date.now().toString(36)}`,
      name: name.trim(),
      shortCode: code,
      address: address?.trim() || '',
      locationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockWarehouses.unshift(newWh);

    return {
      data: newWh as unknown as T,
      message: 'Warehouse created successfully',
    };
  }

  // PATCH /warehouses/:id
  if (endpoint.startsWith('/warehouses/') && !endpoint.includes('/locations') && method === 'PATCH') {
    const warehouseId = endpoint.split('/')[2]?.split('?')[0];
    const { name, shortCode, address } = body;

    const whIndex = mockWarehouses.findIndex((w) => w.id === warehouseId);
    if (whIndex === -1) {
      throw new ApiError('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404);
    }

    if (shortCode && shortCode.trim()) {
      const code = shortCode.trim().toUpperCase();
      const duplicate = mockWarehouses.find(
        (w) => w.id !== warehouseId && w.shortCode.toUpperCase() === code
      );
      if (duplicate) {
        throw new ApiError('A warehouse with this short code already exists', 'CONFLICT', 409);
      }
      mockWarehouses[whIndex].shortCode = code;
    }

    if (name && name.trim()) {
      mockWarehouses[whIndex].name = name.trim();
    }

    if (address !== undefined) {
      mockWarehouses[whIndex].address = address.trim();
    }

    mockWarehouses[whIndex].updatedAt = new Date().toISOString();

    return {
      data: mockWarehouses[whIndex] as unknown as T,
      message: 'Warehouse updated successfully',
    };
  }

  // DELETE /warehouses/:id
  if (endpoint.startsWith('/warehouses/') && !endpoint.includes('/locations') && method === 'DELETE') {
    const warehouseId = endpoint.split('/')[2]?.split('?')[0];
    const wh = mockWarehouses.find((w) => w.id === warehouseId);
    if (!wh) {
      throw new ApiError('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404);
    }

    const childLocations = mockLocations.filter((l) => l.warehouseId === warehouseId);
    if (childLocations.length > 0) {
      throw new ApiError(
        `Cannot delete warehouse "${wh.name}" because it still contains ${childLocations.length} active storage location${childLocations.length > 1 ? 's' : ''}. Please remove or transfer locations first.`,
        'CONFLICT',
        409
      );
    }

    mockWarehouses = mockWarehouses.filter((w) => w.id !== warehouseId);

    return {
      data: null as unknown as T,
      message: 'Warehouse deactivated successfully',
    };
  }

  // ==========================================
  // LOCATIONS ENDPOINTS (API Contract §12)
  // ==========================================

  // GET /locations
  if (endpoint.startsWith('/locations') && method === 'GET') {
    const parts = endpoint.split('/');
    if (parts.length > 2 && parts[2]) {
      const locId = parts[2].split('?')[0];
      const loc = mockLocations.find((l) => l.id === locId);
      if (!loc) {
        throw new ApiError('Location not found', 'NOT_FOUND', 404);
      }
      const parentWh = mockWarehouses.find((w) => w.id === loc.warehouseId);
      return {
        data: {
          ...loc,
          warehouseName: parentWh?.name,
          warehouseShortCode: parentWh?.shortCode,
        } as unknown as T,
        message: 'Success',
      };
    }

    const urlObj = new URL(endpoint, 'http://localhost');
    const warehouseId = urlObj.searchParams.get('warehouseId');
    const search = urlObj.searchParams.get('search')?.toLowerCase() || '';

    let filtered = [...mockLocations];
    if (warehouseId) {
      filtered = filtered.filter((l) => l.warehouseId === warehouseId);
    }
    if (search) {
      filtered = filtered.filter(
        (l) => l.name.toLowerCase().includes(search) || l.shortCode.toLowerCase().includes(search)
      );
    }

    const enriched = filtered.map((l) => {
      const parent = mockWarehouses.find((w) => w.id === l.warehouseId);
      return {
        ...l,
        warehouseName: parent?.name || 'Unknown Warehouse',
        warehouseShortCode: parent?.shortCode || 'WH',
      };
    });

    return {
      data: enriched as unknown as T,
      message: 'Success',
    };
  }

  // POST /locations
  if (endpoint === '/locations' && method === 'POST') {
    const { name, shortCode, warehouseId } = body;
    if (!name || !name.trim()) {
      throw new ApiError('Location name is required', 'VALIDATION_ERROR', 400);
    }
    if (!shortCode || !shortCode.trim()) {
      throw new ApiError('Short code is required', 'VALIDATION_ERROR', 400);
    }
    if (!warehouseId) {
      throw new ApiError('Parent warehouse is required', 'VALIDATION_ERROR', 400);
    }

    const parentWh = mockWarehouses.find((w) => w.id === warehouseId);
    if (!parentWh) {
      throw new ApiError('Parent warehouse not found', 'WAREHOUSE_NOT_FOUND', 404);
    }

    const code = shortCode.trim().toUpperCase();
    const existing = mockLocations.find(
      (l) => l.warehouseId === warehouseId && l.shortCode.toUpperCase() === code
    );
    if (existing) {
      throw new ApiError(
        `A location with code "${code}" already exists in warehouse "${parentWh.name}"`,
        'CONFLICT',
        409
      );
    }

    const newLoc = {
      id: `loc_${Date.now().toString(36)}`,
      name: name.trim(),
      shortCode: code,
      warehouseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockLocations.unshift(newLoc);

    return {
      data: {
        ...newLoc,
        warehouseName: parentWh.name,
        warehouseShortCode: parentWh.shortCode,
      } as unknown as T,
      message: 'Location created successfully',
    };
  }

  // PATCH /locations/:id
  if (endpoint.startsWith('/locations/') && method === 'PATCH') {
    const locId = endpoint.split('/')[2]?.split('?')[0];
    const { name, shortCode } = body;

    const locIndex = mockLocations.findIndex((l) => l.id === locId);
    if (locIndex === -1) {
      throw new ApiError('Location not found', 'NOT_FOUND', 404);
    }

    const targetLoc = mockLocations[locIndex];
    if (shortCode && shortCode.trim()) {
      const code = shortCode.trim().toUpperCase();
      const duplicate = mockLocations.find(
        (l) => l.id !== locId && l.warehouseId === targetLoc.warehouseId && l.shortCode.toUpperCase() === code
      );
      if (duplicate) {
        throw new ApiError(`A location with code "${code}" already exists in this warehouse`, 'CONFLICT', 409);
      }
      mockLocations[locIndex].shortCode = code;
    }

    if (name && name.trim()) {
      mockLocations[locIndex].name = name.trim();
    }

    mockLocations[locIndex].updatedAt = new Date().toISOString();

    const parent = mockWarehouses.find((w) => w.id === targetLoc.warehouseId);

    return {
      data: {
        ...mockLocations[locIndex],
        warehouseName: parent?.name,
        warehouseShortCode: parent?.shortCode,
      } as unknown as T,
      message: 'Location updated successfully',
    };
  }

  // DELETE /locations/:id
  if (endpoint.startsWith('/locations/') && method === 'DELETE') {
    const locId = endpoint.split('/')[2]?.split('?')[0];
    const loc = mockLocations.find((l) => l.id === locId);
    if (!loc) {
      throw new ApiError('Location not found', 'NOT_FOUND', 404);
    }

    // Invariant: cannot delete location containing stock or historical movements
    if (loc.shortCode === 'STOCK') {
      throw new ApiError(
        `Cannot delete location "${loc.name}". It contains active inventory stock. Please adjust or transfer stock first.`,
        'CONFLICT',
        409
      );
    }

    mockLocations = mockLocations.filter((l) => l.id !== locId);

    return {
      data: null as unknown as T,
      message: 'Location deleted successfully',
    };
  }

  throw new ApiError(`Endpoint ${endpoint} not found`, 'NOT_FOUND', 404);
}
