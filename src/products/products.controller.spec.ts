import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { InventoryClientService } from './inventory-client.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    findAll: vi.fn(),
    findProductById: vi.fn(),
    createProduct: vi.fn(),
  };

  const mockInventoryClient = {
    getStock: vi.fn(),
    reserveStock: vi.fn(),
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
        {
          provide: InventoryClientService,
          useValue: mockInventoryClient,
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

  it('should retrieve inventory from the inventory client', async () => {
    const productId = '6acadc5fa5b74332acefba4d';

    const inventory = {
      productId,
      stock: 120,
      available: true,
    };

    mockInventoryClient.getStock.mockResolvedValue(inventory);

    const result = await controller.getInventory(productId);

    expect(result).toEqual(inventory);
    expect(mockInventoryClient.getStock).toHaveBeenCalledWith(productId);
  });

  it('should reserve stock through InventoryClientService', async () => {
    const productId = '6acadc5fa5b74332acefba4d';

    const reservation = {
      productId,
      quantity: 120,
      reserved: 20,
      availableStock: 100,
    };

    mockInventoryClient.reserveStock.mockResolvedValue(reservation);

    const result = await controller.reserveInventory(productId, {
      quantity: 5,
    });

    expect(result).toEqual(reservation);

    expect(mockInventoryClient.reserveStock).toHaveBeenCalledWith(productId, 5);
  });
});
