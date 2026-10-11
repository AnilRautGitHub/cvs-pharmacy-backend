import { describe, it, expect } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateProductDto } from './create-product.dto.js';

describe('CreateProductDto Validation', () => {
  async function validateProduct(data: Record<string, unknown>) {
    const dto = plainToInstance(CreateProductDto, data);
    return validate(dto);
  }

  it('should accept a valid product', async () => {
    const errors = await validateProduct({
      name: 'CVS Vitamin C 500mg',
      price: 9.99,
      stock: 100,
    });

    expect(errors).toHaveLength(0);
  });

  it('should reject an empty product name', async () => {
    const errors = await validateProduct({
      name: '',
      price: 9.99,
      stock: 100,
    });

    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should reject a negative price', async () => {
    const errors = await validateProduct({
      name: 'CVS Vitamin C',
      price: -10,
      stock: 100,
    });

    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('should reject negative stock', async () => {
    const errors = await validateProduct({
      name: 'CVS Vitamin C',
      price: 9.99,
      stock: -5,
    });

    expect(errors.some((e) => e.property === 'stock')).toBe(true);
  });

  it('should reject fractional stock', async () => {
    const errors = await validateProduct({
      name: 'CVS Vitamin C',
      price: 9.99,
      stock: 2.5,
    });

    expect(errors.some((e) => e.property === 'stock')).toBe(true);
  });
});
