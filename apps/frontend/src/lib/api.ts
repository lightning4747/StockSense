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

// In-memory mock database for products
let mockProducts = [
  {
    id: 'prod_01h8x9p3q1m8v2n4t6w1',
    sku: 'DESK001',
    name: 'Ergonomic Standing Desk',
    categoryId: 'cat_01h8x9p3q1m8v2n4t6w2',
    unitOfMeasure: 'unit',
    costPerUnit: 350.0,
    reorderPoint: 10,
    reorderQuantity: 25,
    onHand: 45,
    freeToUse: 40,
    createdAt: '2026-09-26T09:00:00Z',
    updatedAt: '2026-09-26T09:00:00Z',
  },
  {
    id: 'prod_01h8x9p3q1m8v2n4t6w2',
    sku: 'CHAIR002',
    name: 'Mesh Executive Chair',
    categoryId: 'cat_01h8x9p3q1m8v2n4t6w2',
    unitOfMeasure: 'unit',
    costPerUnit: 180.0,
    reorderPoint: 15,
    reorderQuantity: 30,
    onHand: 8,
    freeToUse: 5,
    createdAt: '2026-09-26T09:10:00Z',
    updatedAt: '2026-09-26T09:10:00Z',
  },
  {
    id: 'prod_01h8x9p3q1m8v2n4t6w3',
    sku: 'STEEL003',
    name: 'Cold-Rolled Steel Sheet 2mm',
    categoryId: 'cat_01h8x9p3q1m8v2n4t6w1',
    unitOfMeasure: 'kg',
    costPerUnit: 4.5,
    reorderPoint: 500,
    reorderQuantity: 1000,
    onHand: 0,
    freeToUse: 0,
    createdAt: '2026-09-26T09:20:00Z',
    updatedAt: '2026-09-26T09:20:00Z',
  },
  {
    id: 'prod_01h8x9p3q1m8v2n4t6w4',
    sku: 'BOX004',
    name: 'Heavy-Duty Corrugated Carton Large',
    categoryId: 'cat_01h8x9p3q1m8v2n4t6w3',
    unitOfMeasure: 'bundle',
    costPerUnit: 22.0,
    reorderPoint: 20,
    reorderQuantity: 50,
    onHand: 65,
    freeToUse: 60,
    createdAt: '2026-09-26T09:30:00Z',
    updatedAt: '2026-09-26T09:30:00Z',
  },
  {
    id: 'prod_01h8x9p3q1m8v2n4t6w5',
    sku: 'BOLT005',
    name: 'M8 Stainless Steel Hex Bolts (Pack of 100)',
    categoryId: 'cat_01h8x9p3q1m8v2n4t6w4',
    unitOfMeasure: 'pack',
    costPerUnit: 12.5,
    reorderPoint: 30,
    reorderQuantity: 100,
    onHand: 110,
    freeToUse: 105,
    createdAt: '2026-09-26T09:40:00Z',
    updatedAt: '2026-09-26T09:40:00Z',
  },
];

// In-memory mock database for stock per location
let mockStockEntries = [
  {
    productId: 'prod_01h8x9p3q1m8v2n4t6w1',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w1',
    onHand: 35,
    reserved: 5,
    freeToUse: 30,
  },
  {
    productId: 'prod_01h8x9p3q1m8v2n4t6w1',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w2',
    onHand: 10,
    reserved: 0,
    freeToUse: 10,
  },
  {
    productId: 'prod_01h8x9p3q1m8v2n4t6w2',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w1',
    onHand: 8,
    reserved: 3,
    freeToUse: 5,
  },
  {
    productId: 'prod_01h8x9p3q1m8v2n4t6w4',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w1',
    onHand: 65,
    reserved: 5,
    freeToUse: 60,
  },
  {
    productId: 'prod_01h8x9p3q1m8v2n4t6w5',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w2',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w3',
    onHand: 110,
    reserved: 5,
    freeToUse: 105,
  },
];

// In-memory mock database for reordering rules
let mockReorderingRules = [
  {
    id: 'rule_01h8x9p3q1m8v2n4t6w1',
    productId: 'prod_01h8x9p3q1m8v2n4t6w1',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w1',
    minQuantity: 10,
    maxQuantity: 50,
    createdAt: '2026-09-26T09:05:00Z',
    updatedAt: '2026-09-26T09:05:00Z',
  },
  {
    id: 'rule_01h8x9p3q1m8v2n4t6w2',
    productId: 'prod_01h8x9p3q1m8v2n4t6w2',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    locationId: 'loc_01h8x9p3q1m8v2n4t6w1',
    minQuantity: 15,
    maxQuantity: 60,
    createdAt: '2026-09-26T09:15:00Z',
    updatedAt: '2026-09-26T09:15:00Z',
  },
];

// In-memory mock database for receipts
let mockReceipts: Array<{
  id: string;
  reference: string;
  warehouseId: string;
  destinationLocationId: string;
  supplierName: string;
  scheduledAt: string;
  responsibleUserId: string;
  status: 'DRAFT' | 'READY' | 'DONE' | 'CANCELED';
  items: Array<{ id: string; productId: string; quantity: number }>;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 'rec_01h8x9p3q1m8v2n4t6w1',
    reference: 'WH/IN/0001',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    destinationLocationId: 'loc_01h8x9p3q1m8v2n4t6w1',
    supplierName: 'Azure Interior Supply Co.',
    scheduledAt: '2026-09-26T10:00:00Z',
    responsibleUserId: 'usr_01h8x9p3q1m8v2n4t6w9',
    status: 'READY' as const,
    items: [
      {
        id: 'ri_01h8x9p3q1m8v2n4t6w1',
        productId: 'prod_01h8x9p3q1m8v2n4t6w1',
        quantity: 20,
      },
      {
        id: 'ri_01h8x9p3q1m8v2n4t6w2',
        productId: 'prod_01h8x9p3q1m8v2n4t6w2',
        quantity: 10,
      },
    ],
    createdAt: '2026-09-26T09:00:00Z',
    updatedAt: '2026-09-26T09:30:00Z',
  },
  {
    id: 'rec_01h8x9p3q1m8v2n4t6w2',
    reference: 'WH/IN/0002',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w1',
    destinationLocationId: 'loc_01h8x9p3q1m8v2n4t6w2',
    supplierName: 'Deco Addict Timber & Hardware',
    scheduledAt: '2026-09-27T14:00:00Z',
    responsibleUserId: 'usr_01h8x9p3q1m8v2n4t6w9',
    status: 'DRAFT' as const,
    items: [
      {
        id: 'ri_01h8x9p3q1m8v2n4t6w3',
        productId: 'prod_01h8x9p3q1m8v2n4t6w3',
        quantity: 500,
      },
    ],
    createdAt: '2026-09-26T09:40:00Z',
    updatedAt: '2026-09-26T09:40:00Z',
  },
  {
    id: 'rec_01h8x9p3q1m8v2n4t6w3',
    reference: 'WH/IN/0003',
    warehouseId: 'wh_01h8x9p3q1m8v2n4t6w2',
    destinationLocationId: 'loc_01h8x9p3q1m8v2n4t6w3',
    supplierName: 'Apex Industrial Fasteners',
    scheduledAt: '2026-09-25T11:00:00Z',
    responsibleUserId: 'usr_01h8x9p3q1m8v2n4t6w9',
    status: 'DONE' as const,
    items: [
      {
        id: 'ri_01h8x9p3q1m8v2n4t6w4',
        productId: 'prod_01h8x9p3q1m8v2n4t6w5',
        quantity: 100,
      },
    ],
    createdAt: '2026-09-25T10:00:00Z',
    updatedAt: '2026-09-25T11:15:00Z',
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

  // ==========================================
  // PRODUCTS ENDPOINTS
  // ==========================================

  // GET /products
  if (endpoint.startsWith('/products') && method === 'GET' && !endpoint.includes('/products/')) {
    const url = new URL(`http://localhost${endpoint}`);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const sku = url.searchParams.get('sku')?.toLowerCase() || '';
    const categoryId = url.searchParams.get('categoryId') || '';
    const stockStatus = url.searchParams.get('stockStatus') || 'all';
    const warehouseId = url.searchParams.get('warehouseId') || '';
    const locationId = url.searchParams.get('locationId') || '';
    const sortBy = url.searchParams.get('sortBy') || 'name';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = mockProducts.map((p) => {
      const cat = mockCategories.find((c) => c.id === p.categoryId);
      // Calculate onHand and freeToUse from stockEntries
      const productStockEntries = mockStockEntries.filter((se) => se.productId === p.id);
      const computedOnHand = productStockEntries.reduce((sum, se) => sum + se.onHand, 0);
      const computedFreeToUse = productStockEntries.reduce((sum, se) => sum + se.freeToUse, 0);
      return {
        ...p,
        category: cat ? { id: cat.id, name: cat.name } : undefined,
        onHand: computedOnHand,
        freeToUse: computedFreeToUse,
      };
    });

    if (search) {
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
      );
    }

    if (sku) {
      filtered = filtered.filter((p) => p.sku.toLowerCase().includes(sku));
    }

    if (categoryId) {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }

    if (warehouseId || locationId) {
      filtered = filtered.filter((p) => {
        return mockStockEntries.some(
          (se) =>
            se.productId === p.id &&
            (!warehouseId || se.warehouseId === warehouseId) &&
            (!locationId || se.locationId === locationId) &&
            se.onHand > 0
        );
      });
    }

    if (stockStatus && stockStatus !== 'all') {
      if (stockStatus === 'out') {
        filtered = filtered.filter((p) => (p.onHand || 0) <= 0);
      } else if (stockStatus === 'low') {
        filtered = filtered.filter((p) => (p.onHand || 0) > 0 && (p.onHand || 0) <= p.reorderPoint);
      } else if (stockStatus === 'available') {
        filtered = filtered.filter((p) => (p.onHand || 0) > p.reorderPoint);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = (a as unknown as Record<string, any>)[sortBy];
      let bVal = (b as unknown as Record<string, any>)[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated as unknown as T,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // GET /products/:productId
  if (endpoint.startsWith('/products/') && method === 'GET') {
    const prodId = endpoint.split('/')[2]?.split('?')[0];
    const prod = mockProducts.find((p) => p.id === prodId);
    if (!prod) {
      throw new ApiError('Product not found', 'NOT_FOUND', 404);
    }

    const cat = mockCategories.find((c) => c.id === prod.categoryId);
    const productStockEntries = mockStockEntries.filter((se) => se.productId === prod.id);
    const onHand = productStockEntries.reduce((sum, se) => sum + se.onHand, 0);
    const freeToUse = productStockEntries.reduce((sum, se) => sum + se.freeToUse, 0);

    return {
      data: {
        ...prod,
        category: cat ? { id: cat.id, name: cat.name } : undefined,
        onHand,
        freeToUse,
      } as unknown as T,
    };
  }

  // POST /products
  if (endpoint === '/products' && method === 'POST') {
    const {
      name,
      sku,
      categoryId,
      unitOfMeasure,
      costPerUnit,
      reorderPoint,
      reorderQuantity,
      initialStock,
      initialLocationId,
    } = body;

    const cleanSku = (sku || '').trim().toUpperCase();
    if (mockProducts.some((p) => p.sku.toUpperCase() === cleanSku)) {
      throw new ApiError(`A product with SKU "${cleanSku}" already exists`, 'CONFLICT', 409);
    }

    const newProductId = `prod_${Date.now().toString(36)}`;
    const newProduct = {
      id: newProductId,
      name: (name || '').trim(),
      sku: cleanSku,
      categoryId,
      unitOfMeasure: (unitOfMeasure || 'unit').trim(),
      costPerUnit: Number(costPerUnit) || 0,
      reorderPoint: Number(reorderPoint) || 0,
      reorderQuantity: Number(reorderQuantity) || 10,
      onHand: Number(initialStock) || 0,
      freeToUse: Number(initialStock) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockProducts.unshift(newProduct);

    // Update category product count
    const cat = mockCategories.find((c) => c.id === categoryId);
    if (cat) {
      cat.productCount = (cat.productCount || 0) + 1;
    }

    // Handle initial stock
    if (Number(initialStock) > 0 && initialLocationId) {
      const loc = mockLocations.find((l) => l.id === initialLocationId);
      if (loc) {
        mockStockEntries.push({
          productId: newProductId,
          warehouseId: loc.warehouseId,
          locationId: loc.id,
          onHand: Number(initialStock),
          reserved: 0,
          freeToUse: Number(initialStock),
        });
      }
    }

    return {
      data: newProduct as unknown as T,
      message: 'Product created successfully',
    };
  }

  // PATCH /products/:productId
  if (endpoint.startsWith('/products/') && method === 'PATCH') {
    const prodId = endpoint.split('/')[2]?.split('?')[0];
    const index = mockProducts.findIndex((p) => p.id === prodId);
    if (index === -1) {
      throw new ApiError('Product not found', 'NOT_FOUND', 404);
    }

    const { name, categoryId, unitOfMeasure, costPerUnit, reorderPoint, reorderQuantity } = body;
    const oldProduct = mockProducts[index];

    if (categoryId && categoryId !== oldProduct.categoryId) {
      const oldCat = mockCategories.find((c) => c.id === oldProduct.categoryId);
      if (oldCat && oldCat.productCount > 0) oldCat.productCount -= 1;
      const newCat = mockCategories.find((c) => c.id === categoryId);
      if (newCat) newCat.productCount = (newCat.productCount || 0) + 1;
      mockProducts[index].categoryId = categoryId;
    }

    if (name) mockProducts[index].name = name.trim();
    if (unitOfMeasure) mockProducts[index].unitOfMeasure = unitOfMeasure.trim();
    if (costPerUnit !== undefined) mockProducts[index].costPerUnit = Number(costPerUnit);
    if (reorderPoint !== undefined) mockProducts[index].reorderPoint = Number(reorderPoint);
    if (reorderQuantity !== undefined) mockProducts[index].reorderQuantity = Number(reorderQuantity);
    mockProducts[index].updatedAt = new Date().toISOString();

    const cat = mockCategories.find((c) => c.id === mockProducts[index].categoryId);

    return {
      data: {
        ...mockProducts[index],
        category: cat ? { id: cat.id, name: cat.name } : undefined,
      } as unknown as T,
      message: 'Product updated successfully',
    };
  }

  // DELETE /products/:productId
  if (endpoint.startsWith('/products/') && method === 'DELETE') {
    const prodId = endpoint.split('/')[2]?.split('?')[0];
    const prod = mockProducts.find((p) => p.id === prodId);
    if (!prod) {
      throw new ApiError('Product not found', 'NOT_FOUND', 404);
    }

    // Invariant: check if product has active stock
    const stockEntries = mockStockEntries.filter((se) => se.productId === prodId);
    const totalOnHand = stockEntries.reduce((sum, se) => sum + se.onHand, 0);
    if (totalOnHand > 0) {
      throw new ApiError(
        `Cannot delete product "${prod.name}" (${prod.sku}). It still has ${totalOnHand} units on hand. Deactivate or write off inventory first.`,
        'CONFLICT',
        409
      );
    }

    mockProducts = mockProducts.filter((p) => p.id !== prodId);
    const cat = mockCategories.find((c) => c.id === prod.categoryId);
    if (cat && cat.productCount > 0) cat.productCount -= 1;

    return {
      data: null as unknown as T,
      message: 'Product deactivated successfully',
    };
  }

  // GET /products/:productId/stock-breakdown
  if (endpoint.includes('/stock-breakdown') && method === 'GET') {
    const prodId = endpoint.split('/')[2];
    const entries = mockStockEntries.filter((se) => se.productId === prodId);
    const breakdown = entries.map((se) => {
      const wh = mockWarehouses.find((w) => w.id === se.warehouseId);
      const loc = mockLocations.find((l) => l.id === se.locationId);
      return {
        warehouseId: se.warehouseId,
        warehouseName: wh?.name || 'Unknown Warehouse',
        locationId: se.locationId,
        locationName: loc?.name || 'Unknown Location',
        onHand: se.onHand,
        reserved: se.reserved,
        freeToUse: se.freeToUse,
      };
    });

    return {
      data: breakdown as unknown as T,
    };
  }

  // ==========================================
  // REORDERING RULES ENDPOINTS
  // ==========================================

  // GET /reordering-rules?productId=...
  if (endpoint.startsWith('/reordering-rules') && method === 'GET') {
    const url = new URL(`http://localhost${endpoint}`);
    const productId = url.searchParams.get('productId');

    let rules = mockReorderingRules;
    if (productId) {
      rules = rules.filter((r) => r.productId === productId);
    }

    const enhanced = rules.map((r) => {
      const wh = mockWarehouses.find((w) => w.id === r.warehouseId);
      const loc = mockLocations.find((l) => l.id === r.locationId);
      return {
        ...r,
        warehouseName: wh?.name || 'Unknown Warehouse',
        locationName: loc?.name || 'Unknown Location',
      };
    });

    return {
      data: enhanced as unknown as T,
    };
  }

  // POST /reordering-rules
  if (endpoint === '/reordering-rules' && method === 'POST') {
    const { productId, warehouseId, locationId, minQuantity, maxQuantity } = body;
    const ruleId = `rule_${Date.now().toString(36)}`;
    const newRule = {
      id: ruleId,
      productId,
      warehouseId,
      locationId,
      minQuantity: Number(minQuantity),
      maxQuantity: Number(maxQuantity),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockReorderingRules.push(newRule);
    const wh = mockWarehouses.find((w) => w.id === warehouseId);
    const loc = mockLocations.find((l) => l.id === locationId);

    return {
      data: {
        ...newRule,
        warehouseName: wh?.name,
        locationName: loc?.name,
      } as unknown as T,
      message: 'Reordering rule created successfully',
    };
  }

  // PATCH /reordering-rules/:ruleId
  if (endpoint.startsWith('/reordering-rules/') && method === 'PATCH') {
    const ruleId = endpoint.split('/')[2]?.split('?')[0];
    const index = mockReorderingRules.findIndex((r) => r.id === ruleId);
    if (index === -1) {
      throw new ApiError('Reordering rule not found', 'NOT_FOUND', 404);
    }

    const { warehouseId, locationId, minQuantity, maxQuantity } = body;
    if (warehouseId) mockReorderingRules[index].warehouseId = warehouseId;
    if (locationId) mockReorderingRules[index].locationId = locationId;
    if (minQuantity !== undefined) mockReorderingRules[index].minQuantity = Number(minQuantity);
    if (maxQuantity !== undefined) mockReorderingRules[index].maxQuantity = Number(maxQuantity);
    mockReorderingRules[index].updatedAt = new Date().toISOString();

    const wh = mockWarehouses.find((w) => w.id === mockReorderingRules[index].warehouseId);
    const loc = mockLocations.find((l) => l.id === mockReorderingRules[index].locationId);

    return {
      data: {
        ...mockReorderingRules[index],
        warehouseName: wh?.name,
        locationName: loc?.name,
      } as unknown as T,
      message: 'Reordering rule updated successfully',
    };
  }

  // DELETE /reordering-rules/:ruleId
  if (endpoint.startsWith('/reordering-rules/') && method === 'DELETE') {
    const ruleId = endpoint.split('/')[2]?.split('?')[0];
    mockReorderingRules = mockReorderingRules.filter((r) => r.id !== ruleId);
    return {
      data: null as unknown as T,
      message: 'Reordering rule removed successfully',
    };
  }

  // ==========================================
  // RECEIPTS ENDPOINTS
  // ==========================================

  // GET /receipts
  if (endpoint.startsWith('/receipts') && method === 'GET' && !endpoint.includes('/receipts/')) {
    const url = new URL(`http://localhost${endpoint}`);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const status = url.searchParams.get('status') || '';
    const warehouseId = url.searchParams.get('warehouseId') || '';
    const locationId = url.searchParams.get('locationId') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filtered = mockReceipts.map((r) => {
      const wh = mockWarehouses.find((w) => w.id === r.warehouseId);
      const loc = mockLocations.find((l) => l.id === r.destinationLocationId);
      const enhancedItems = r.items.map((item) => {
        const prod = mockProducts.find((p) => p.id === item.productId);
        return {
          ...item,
          sku: prod?.sku || 'UNKNOWN',
          productName: prod?.name || 'Unknown Product',
        };
      });

      return {
        ...r,
        from: 'Vendor',
        to: `${wh?.shortCode || 'WH'}/${loc?.name || 'Location'}`,
        contact: r.supplierName,
        warehouseName: wh?.name,
        warehouseShortCode: wh?.shortCode,
        destinationLocationName: loc?.name,
        destinationLocationShortCode: loc?.shortCode,
        responsible: {
          id: r.responsibleUserId,
          loginId: 'inventory01',
        },
        items: enhancedItems,
      };
    });

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.reference.toLowerCase().includes(search) ||
          r.supplierName.toLowerCase().includes(search) ||
          r.items.some((i) => i.productName.toLowerCase().includes(search) || i.sku.toLowerCase().includes(search))
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (warehouseId) {
      filtered = filtered.filter((r) => r.warehouseId === warehouseId);
    }

    if (locationId) {
      filtered = filtered.filter((r) => r.destinationLocationId === locationId);
    }

    if (dateFrom) {
      filtered = filtered.filter((r) => new Date(r.scheduledAt) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter((r) => new Date(r.scheduledAt) <= new Date(dateTo));
    }

    filtered.sort((a, b) => {
      let aVal = (a as unknown as Record<string, any>)[sortBy];
      let bVal = (b as unknown as Record<string, any>)[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated as unknown as T,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // GET /receipts/:receiptId
  if (
    endpoint.startsWith('/receipts/') &&
    method === 'GET' &&
    !endpoint.endsWith('/ready') &&
    !endpoint.endsWith('/validate') &&
    !endpoint.endsWith('/cancel')
  ) {
    const receiptId = endpoint.split('/')[2]?.split('?')[0];
    const receipt = mockReceipts.find((r) => r.id === receiptId);
    if (!receipt) {
      throw new ApiError('Receipt not found', 'NOT_FOUND', 404);
    }

    const wh = mockWarehouses.find((w) => w.id === receipt.warehouseId);
    const loc = mockLocations.find((l) => l.id === receipt.destinationLocationId);
    const items = receipt.items.map((item) => {
      const prod = mockProducts.find((p) => p.id === item.productId);
      return {
        ...item,
        sku: prod?.sku || 'UNKNOWN',
        productName: prod?.name || 'Unknown Product',
      };
    });

    return {
      data: {
        ...receipt,
        warehouseName: wh?.name,
        warehouseShortCode: wh?.shortCode,
        destinationLocationName: loc?.name,
        destinationLocationShortCode: loc?.shortCode,
        from: 'Vendor',
        to: `${wh?.shortCode || 'WH'}/${loc?.name || 'Location'}`,
        contact: receipt.supplierName,
        responsible: {
          id: receipt.responsibleUserId,
          loginId: 'inventory01',
        },
        items,
      } as unknown as T,
    };
  }

  // POST /receipts
  if (endpoint === '/receipts' && method === 'POST') {
    const { warehouseId, destinationLocationId, supplierName, scheduledAt, items } = body;
    const nextSeq = String(mockReceipts.length + 1).padStart(4, '0');
    const wh = mockWarehouses.find((w) => w.id === warehouseId);
    const reference = `${wh?.shortCode || 'WH'}/IN/${nextSeq}`;
    const newReceiptId = `rec_${Date.now().toString(36)}`;

    const newItems = (items || []).map((it: any, idx: number) => ({
      id: `ri_${Date.now().toString(36)}_${idx}`,
      productId: it.productId,
      quantity: Number(it.quantity) || 1,
    }));

    const newReceipt = {
      id: newReceiptId,
      reference,
      warehouseId,
      destinationLocationId,
      supplierName: (supplierName || '').trim(),
      scheduledAt: scheduledAt || new Date().toISOString(),
      responsibleUserId: 'usr_01h8x9p3q1m8v2n4t6w9',
      status: 'DRAFT' as const,
      items: newItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockReceipts.unshift(newReceipt);

    return {
      data: {
        id: newReceiptId,
        reference,
        status: 'DRAFT',
        items: newItems,
      } as unknown as T,
      message: 'Receipt created successfully',
    };
  }

  // PATCH /receipts/:receiptId
  if (endpoint.startsWith('/receipts/') && method === 'PATCH') {
    const receiptId = endpoint.split('/')[2]?.split('?')[0];
    const index = mockReceipts.findIndex((r) => r.id === receiptId);
    if (index === -1) {
      throw new ApiError('Receipt not found', 'NOT_FOUND', 404);
    }

    if (mockReceipts[index].status === 'DONE' || mockReceipts[index].status === 'CANCELED') {
      throw new ApiError(
        `Receipt in status "${mockReceipts[index].status}" cannot be modified`,
        'CONFLICT',
        409
      );
    }

    const { supplierName, scheduledAt, destinationLocationId, items } = body;
    if (supplierName) mockReceipts[index].supplierName = supplierName.trim();
    if (scheduledAt) mockReceipts[index].scheduledAt = scheduledAt;
    if (destinationLocationId) mockReceipts[index].destinationLocationId = destinationLocationId;
    if (items && Array.isArray(items)) {
      mockReceipts[index].items = items.map((it: any, idx: number) => ({
        id: it.id || `ri_${Date.now().toString(36)}_${idx}`,
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
      }));
    }
    mockReceipts[index].updatedAt = new Date().toISOString();

    return {
      data: mockReceipts[index] as unknown as T,
      message: 'Receipt updated successfully',
    };
  }

  // POST /receipts/:receiptId/ready
  if (endpoint.includes('/ready') && method === 'POST') {
    const receiptId = endpoint.split('/')[2];
    const index = mockReceipts.findIndex((r) => r.id === receiptId);
    if (index === -1) {
      throw new ApiError('Receipt not found', 'NOT_FOUND', 404);
    }

    if (mockReceipts[index].status !== 'DRAFT') {
      throw new ApiError(
        `Cannot mark as ready: current status is "${mockReceipts[index].status}" (expected DRAFT)`,
        'CONFLICT',
        409
      );
    }

    mockReceipts[index].status = 'READY';
    mockReceipts[index].updatedAt = new Date().toISOString();

    return {
      data: {
        id: mockReceipts[index].id,
        status: 'READY',
      } as unknown as T,
      message: 'Receipt is ready',
    };
  }

  // POST /receipts/:receiptId/validate
  if (endpoint.includes('/validate') && method === 'POST') {
    const receiptId = endpoint.split('/')[2];
    const index = mockReceipts.findIndex((r) => r.id === receiptId);
    if (index === -1) {
      throw new ApiError('Receipt not found', 'NOT_FOUND', 404);
    }

    if (mockReceipts[index].status === 'DONE') {
      throw new ApiError('Receipt is already validated', 'CONFLICT', 409);
    }

    if (mockReceipts[index].status !== 'READY') {
      throw new ApiError(
        `Cannot validate: receipt must be in READY state (currently "${mockReceipts[index].status}")`,
        'CONFLICT',
        409
      );
    }

    const receipt = mockReceipts[index];

    // Atomically increase stock at destination location
    for (const item of receipt.items) {
      const stockEntry = mockStockEntries.find(
        (se) =>
          se.productId === item.productId &&
          se.warehouseId === receipt.warehouseId &&
          se.locationId === receipt.destinationLocationId
      );

      if (stockEntry) {
        stockEntry.onHand += item.quantity;
        stockEntry.freeToUse += item.quantity;
      } else {
        mockStockEntries.push({
          productId: item.productId,
          warehouseId: receipt.warehouseId,
          locationId: receipt.destinationLocationId,
          onHand: item.quantity,
          reserved: 0,
          freeToUse: item.quantity,
        });
      }
    }

    mockReceipts[index].status = 'DONE';
    mockReceipts[index].updatedAt = new Date().toISOString();

    return {
      data: {
        id: receipt.id,
        reference: receipt.reference,
        status: 'DONE',
      } as unknown as T,
      message: 'Receipt validated successfully',
    };
  }

  // POST /receipts/:receiptId/cancel
  if (endpoint.includes('/cancel') && method === 'POST') {
    const receiptId = endpoint.split('/')[2];
    const index = mockReceipts.findIndex((r) => r.id === receiptId);
    if (index === -1) {
      throw new ApiError('Receipt not found', 'NOT_FOUND', 404);
    }

    if (mockReceipts[index].status === 'DONE') {
      throw new ApiError('A validated (DONE) receipt cannot be canceled', 'CONFLICT', 409);
    }

    mockReceipts[index].status = 'CANCELED';
    mockReceipts[index].updatedAt = new Date().toISOString();

    return {
      data: {
        id: mockReceipts[index].id,
        status: 'CANCELED',
      } as unknown as T,
      message: 'Receipt canceled successfully',
    };
  }

  throw new ApiError(`Endpoint ${endpoint} not found`, 'NOT_FOUND', 404);
}
