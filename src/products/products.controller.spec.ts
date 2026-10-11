import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    findAll: vi.fn(),
    findProductById: vi.fn(),
    createProduct: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return products from ProductsService', async () => {
    const products = [
      {
        _id: '6acadc5fa5b74332acefba4d',
        name: 'CVS Vitamin C 500mg',
        price: 7.99,
        stock: 120,
      },
    ];

    mockProductsService.findAll.mockResolvedValue(products);

    const result = await controller.findAll();

    expect(result).toEqual(products);
    expect(mockProductsService.findAll).toHaveBeenCalledTimes(1);
  });
});
