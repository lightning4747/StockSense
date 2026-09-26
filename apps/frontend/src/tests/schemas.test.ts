import { describe, it, expect } from 'vitest';
import { createDeliverySchema, updateDeliverySchema } from '@/schemas/delivery';
import { createTransferSchema, updateTransferSchema } from '@/schemas/transfer';
import { createAdjustmentSchema } from '@/schemas/adjustment';
import { stockFilterSchema } from '@/schemas/stock';
import { createReceiptSchema } from '@/schemas/receipt';
import { categorySchema } from '@/schemas/category';
import { cn } from '@/lib/utils';

describe('Delivery Schemas', () => {
  it('should validate valid delivery data', () => {
    const validData = {
      warehouseId: '11111111-1111-1111-1111-111111111111',
      sourceLocationId: '22222222-2222-2222-2222-222222222222',
      deliveryAddress: 'Customer St 123',
      scheduledAt: '2026-09-26',
      items: [{ productId: 'prod-1', quantity: 5 }],
    };

    const result = createDeliverySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate update delivery payload', () => {
    const validUpdate = {
      deliveryAddress: 'Updated Shipping Address 456',
      items: [{ productId: 'prod-2', quantity: 12 }],
    };

    const result = updateDeliverySchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should reject empty warehouse and sourceLocation', () => {
    const invalidData = {
      warehouseId: '',
      sourceLocationId: '',
      items: [{ productId: 'prod-1', quantity: 5 }],
    };

    const result = createDeliverySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject non-positive quantities', () => {
    const invalidData = {
      warehouseId: 'wh-1',
      sourceLocationId: 'loc-1',
      items: [{ productId: 'prod-1', quantity: 0 }],
    };

    const result = createDeliverySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject delivery with empty items array', () => {
    const invalidData = {
      warehouseId: 'wh-1',
      sourceLocationId: 'loc-1',
      items: [],
    };

    const result = createDeliverySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Transfer Schemas', () => {
  it('should validate valid transfer data with distinct source and destination', () => {
    const validData = {
      warehouseId: 'wh-1',
      sourceLocationId: 'loc-source',
      destinationLocationId: 'loc-dest',
      scheduledAt: '2026-09-26',
      items: [{ productId: 'prod-1', quantity: 10 }],
    };

    const result = createTransferSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate update transfer payload', () => {
    const validUpdate = {
      destinationLocationId: 'loc-new-dest',
      items: [{ productId: 'prod-3', quantity: 7 }],
    };

    const result = updateTransferSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('should reject when source and destination locations are identical', () => {
    const invalidData = {
      warehouseId: 'wh-1',
      sourceLocationId: 'loc-same',
      destinationLocationId: 'loc-same',
      items: [{ productId: 'prod-1', quantity: 10 }],
    };

    const result = createTransferSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe('Source and destination locations must differ');
    }
  });
});

describe('Stock Adjustment Schemas', () => {
  it('should validate valid adjustment data', () => {
    const validData = {
      productId: 'prod-1',
      locationId: 'loc-1',
      countedQuantity: 42,
      reason: 'Physical inventory cycle count',
    };

    const result = createAdjustmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should allow counted quantity of 0 (scrapped/cleared inventory)', () => {
    const validZero = {
      productId: 'prod-1',
      locationId: 'loc-1',
      countedQuantity: 0,
      reason: 'Total loss / scrapped',
    };

    const result = createAdjustmentSchema.safeParse(validZero);
    expect(result.success).toBe(true);
  });

  it('should reject negative counted quantity', () => {
    const invalidData = {
      productId: 'prod-1',
      locationId: 'loc-1',
      countedQuantity: -5,
      reason: 'Typo count',
    };

    const result = createAdjustmentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing reason', () => {
    const invalidData = {
      productId: 'prod-1',
      locationId: 'loc-1',
      countedQuantity: 10,
      reason: '',
    };

    const result = createAdjustmentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Stock Filter Schemas', () => {
  it('should parse valid filter and default stockStatus to all', () => {
    const result = stockFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockStatus).toBe('all');
    }
  });

  it('should accept valid stockStatus values', () => {
    expect(stockFilterSchema.safeParse({ stockStatus: 'available' }).success).toBe(true);
    expect(stockFilterSchema.safeParse({ stockStatus: 'low' }).success).toBe(true);
    expect(stockFilterSchema.safeParse({ stockStatus: 'out' }).success).toBe(true);
  });
});

describe('Category & Receipt Schemas', () => {
  it('should validate category schema', () => {
    expect(categorySchema.safeParse({ name: 'Furniture' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('should validate receipt schema', () => {
    const validReceipt = {
      warehouseId: 'wh-1',
      destinationLocationId: 'loc-1',
      supplierName: 'Acme Corp',
      scheduledAt: '2026-09-26',
      items: [{ productId: 'p-1', quantity: 20 }],
    };
    expect(createReceiptSchema.safeParse(validReceipt).success).toBe(true);
  });
});

describe('Utility Functions', () => {
  it('cn helper combines class names conditionally', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    expect(cn('px-2', false && 'hidden', 'text-sm')).toBe('px-2 text-sm');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});
