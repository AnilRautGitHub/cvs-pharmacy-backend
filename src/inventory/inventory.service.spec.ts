import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryService } from './inventory.service.js';
import { Inventory } from './schemas/inventory.schema.js';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Reservation } from './schemas/reservation.schema.js';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockInventoryModel = {
    findOneAndUpdate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getModelToken(Inventory.name),
          useValue: mockInventoryModel,
        },
        {
          provide: getModelToken(Reservation.name),
          useValue: {
            findOne: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: {
            startSession: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('reserveStock', () => {
    const productId = '6acadc5fa5b74332acefba4d';

    it('should reserve stock successfully', async () => {
      const updatedInventory = {
        productId,
        quantity: 120,
        reserved: 30,
      };

      mockInventoryModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedInventory),
      });

      const result = await service.reserveStock({
        productId,
        quantity: 5,
      });

      expect(result).toEqual({
        productId,
        quantity: 120,
        reserved: 30,
        availableStock: 90,
      });

      expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          productId,
          $expr: {
            $gte: [{ $subtract: ['$quantity', '$reserved'] }, 5],
          },
        },
        {
          $inc: { reserved: 5 },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      );
    });

    it('should reject insufficient stock', async () => {
      mockInventoryModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.reserveStock({
          productId,
          quantity: 200,
        }),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('releaseStock', () => {
    const productId = '6acadc5fa5b74332acefba4d';

    it('should release reserved stock successfully', async () => {
      const updatedInventory = {
        productId,
        quantity: 120,
        reserved: 20,
      };

      mockInventoryModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedInventory),
      });

      const result = await service.releaseStock({
        productId,
        quantity: 5,
      });

      expect(result).toEqual({
        productId,
        quantity: 120,
        reserved: 20,
        availableStock: 100,
      });

      expect(mockInventoryModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          productId,
          reserved: { $gte: 5 },
        },
        {
          $inc: { reserved: -5 },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      );
    });

    it('should reject release when reserved stock is insufficient', async () => {
      mockInventoryModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.releaseStock({
          productId,
          quantity: 200,
        }),
      ).rejects.toThrow(RpcException);
    });
  });
});
