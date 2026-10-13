import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { InventoryController } from './inventory.controller.js';
import { Inventory, InventorySchema } from './schemas/inventory.schema.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/cvs_inventory'),
    MongooseModule.forFeature([
      {
        name: Inventory.name,
        schema: InventorySchema,
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
