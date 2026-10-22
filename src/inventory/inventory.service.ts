import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { Inventory } from './schemas/inventory.schema.js';
import { RpcException } from '@nestjs/microservices';
import { ReserveStockDto } from './dto/reserve-stock.dto.js';
import { ReleaseStockDto } from './dto/release-stock.dto.js';
import { Reservation } from './schemas/reservation.schema.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { ReservationStatus } from './schemas/reservation.schema.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<Inventory>,

    @InjectModel(Reservation.name)
    private readonly reservationModel: Model<Reservation>,

    @InjectConnection()
    private readonly connection: Connection,
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

  async releaseStock(data: ReleaseStockDto) {
    const { productId, quantity } = data;

    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        {
          productId,
          reserved: { $gte: quantity },
        },
        {
          $inc: { reserved: -quantity },
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
        message: 'Insufficient reserved stock or inventory not found',
      });
    }

    return {
      productId: inventory.productId,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      availableStock: inventory.quantity - inventory.reserved,
    };
  }

  private async findExistingReservation(data: CreateReservationDto) {
    const existing = await this.reservationModel
      .findOne({ reservationId: data.reservationId })
      .lean()
      .exec();

    if (!existing) return null;

    if (
      existing.productId !== data.productId ||
      existing.quantity !== data.quantity
    ) {
      throw new RpcException({
        statusCode: 409,
        message: 'Reservation ID already used with different details',
      });
    }

    return existing;
  }

  async createReservation(data: CreateReservationDto) {
    const existing = await this.findExistingReservation(data);

    if (existing) {
      return {
        reservationId: existing.reservationId,
        productId: existing.productId,
        quantity: existing.quantity,
        status: existing.status,
        idempotentReplay: true,
      };
    }

    const session = await this.connection.startSession();

    try {
      await session.withTransaction(async () => {
        const inventory = await this.inventoryModel
          .findOneAndUpdate(
            {
              productId: data.productId,
              $expr: {
                $gte: [
                  { $subtract: ['$quantity', '$reserved'] },
                  data.quantity,
                ],
              },
            },
            { $inc: { reserved: data.quantity } },
            {
              session,
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

        await this.reservationModel.create(
          [
            {
              reservationId: data.reservationId,
              productId: data.productId,
              quantity: data.quantity,
              status: ReservationStatus.ACTIVE,
            },
          ],
          { session },
        );
      });

      return {
        reservationId: data.reservationId,
        productId: data.productId,
        quantity: data.quantity,
        status: ReservationStatus.ACTIVE,
        idempotentReplay: false,
      };
    } catch (error: unknown) {
      // A concurrent request may have inserted the same reservation ID.
      // After our transaction aborts, check the committed reservation.
      const duplicateKey =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000;

      if (duplicateKey) {
        const committed = await this.findExistingReservation(data);

        if (committed) {
          return {
            reservationId: committed.reservationId,
            productId: committed.productId,
            quantity: committed.quantity,
            status: committed.status,
            idempotentReplay: true,
          };
        }
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }
}
