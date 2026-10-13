import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { Inventory } from './schemas/inventory.schema.js';
import { RpcException } from '@nestjs/microservices';
import { ReserveStockDto } from './dto/reserve-stock.dto.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<Inventory>,
  ) {}

  async getStock(productId: string) {
    const inventory = await this.inventoryModel
      .findOne({ productId })
      .lean()
      .exec();

    if (!inventory) {
      throw new RpcException({
        statusCode: 404,
        message: `Inventory not found for product ${productId}`,
      });
    }

    const availableStock = inventory.quantity - inventory.reserved;

    return {
      productId,
      stock: availableStock,
      available: availableStock > 0,
    };
  }

  async createStock(data: {
    productId: string;
    quantity: number;
    reserved: number;
  }) {
    if (data.reserved > data.quantity) {
      throw new BadRequestException(
        'Reserved stock cannot exceed total quantity',
      );
    }
    const inventory = await this.inventoryModel.create(data);

    return {
      productId: inventory.productId,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      stock: inventory.quantity - inventory.reserved,
    };
  }

  async reserveStock(data: ReserveStockDto) {
    const { productId, quantity } = data;

    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        {
          productId,
          $expr: {
            $gte: [{ $subtract: ['$quantity', '$reserved'] }, quantity],
          },
        },
        {
          $inc: { reserved: quantity },
        },
        {
          returnDocument: 'after',
          runValidators: true,
        },
      )
      .exec();

    if (!inventory) {
      throw new RpcException({
        statusCode: 409,
        message: 'Insufficient stock or inventory not found',
      });
    }

    return {
      productId: inventory.productId,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      availableStock: inventory.quantity - inventory.reserved,
    };
  }
}
