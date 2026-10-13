import { IsMongoId, IsInt, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsMongoId()
  productId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(0)
  reserved!: number;
}
