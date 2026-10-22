import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { InventoryClientService } from './inventory-client.service.js';
import { ReserveInventoryDto } from './dto/reserve-inventory.dto.js';
import { CreateReservationDto } from '../inventory/dto/create-reservation.dto.js';
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly inventoryClient: InventoryClientService,
  ) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get(':id/inventory')
  async getInventory(@Param('id') id: string) {
    return this.inventoryClient.getStock(id);
  }

  @Post(':id/inventory/reserve')
  async reserveInventory(
    @Param('id') id: string,
    @Body() body: ReserveInventoryDto,
  ) {
    return this.inventoryClient.reserveStock(id, body.quantity);
  }

  @Post(':id/inventory/release')
  @HttpCode(200)
  async releaseInventory(
    @Param('id') id: string,
    @Body() body: ReserveInventoryDto,
  ) {
    return this.inventoryClient.releaseStock(id, body.quantity);
  }

  @Post(':id/inventory/reservations')
  @HttpCode(200)
  async createReservation(
    @Param('id') productId: string,
    @Body() body: CreateReservationDto,
  ) {
    return this.inventoryClient.createReservation({
      ...body,
      productId,
    });
  }
}
