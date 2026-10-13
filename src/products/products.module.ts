import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';
import { ProductsResolver } from './products.resolver.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InventoryClientService } from './inventory-client.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4001,
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsResolver, InventoryClientService],
})
export class ProductsModule {}
