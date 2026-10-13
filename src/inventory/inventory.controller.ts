import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryService } from './inventory.service.js';
import { CreateInventoryDto } from './dto/create-inventory.dto.js';
import { ReserveStockDto } from './dto/reserve-stock.dto.js';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern('inventory.get_stock')
  getStock(@Payload() data: { productId: string }) {
    return this.inventoryService.getStock(data.productId);
  }

  @MessagePattern('inventory.create_stock')
  async createStock(@Payload() data: CreateInventoryDto) {
    return this.inventoryService.createStock(data);
  }

  @MessagePattern('inventory.reserve_stock')
  async reserveStock(@Payload() data: ReserveStockDto) {
    return this.inventoryService.reserveStock(data);
  }
}
