import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProductsService } from './products.service.js';
import { Product } from './schemas/product.schema.js';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProductModel = {
    findByIdAndDelete: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('deleteProduct', () => {
    const validId = '6acadc5fa5b74332acefba4d';

    it('should delete an existing product', async () => {
      mockProductModel.findByIdAndDelete.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: validId,
          name: 'Temporary Product',
        }),
      });

      await expect(service.deleteProduct(validId)).resolves.toBe(true);

      expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith(validId);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductModel.findByIdAndDelete.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.deleteProduct(validId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject an invalid MongoDB ID', async () => {
      await expect(service.deleteProduct('invalid-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(mockProductModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('createProduct', () => {
    const productDto = {
      name: 'CVS Vitamin D3 2000 IU',
      price: 11.99,
      stock: 50,
    };

    it('should create a product successfully', async () => {
      const savedProduct = {
        _id: '6acadc5fa5b74332acefba4e',
        ...productDto,
      };

      mockProductModel.create.mockResolvedValue(savedProduct);

      const result = await service.createProduct(productDto);

      expect(result).toEqual(savedProduct);

      expect(mockProductModel.create).toHaveBeenCalledWith(productDto);

      expect(mockProductModel.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate a MongoDB creation error', async () => {
      mockProductModel.create.mockRejectedValue(
        new Error('MongoDB write failed'),
      );

      await expect(service.createProduct(productDto)).rejects.toThrow(
        'MongoDB write failed',
      );
    });
  });

  describe('updateProduct', () => {
    const validId = '6acadc5fa5b74332acefba4d';

    const updateInput = {
      price: 7.99,
    };

    it('should update an existing product', async () => {
      const updatedProduct = {
        _id: validId,
        name: 'CVS Vitamin C 500mg',
        price: 7.99,
        stock: 120,
      };

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(updatedProduct),
      });

      const result = await service.updateProduct(validId, updateInput);

      expect(result).toEqual(updatedProduct);

      expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validId,
        { $set: updateInput },
        { new: true, runValidators: true },
      );
    });

    it('should throw NotFoundException when product is missing', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.updateProduct(validId, updateInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject an invalid product ID', async () => {
      await expect(
        service.updateProduct('invalid-id', updateInput),
      ).rejects.toThrow(NotFoundException);

      expect(mockProductModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});
