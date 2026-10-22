import { IsString, IsNotEmpty, IsMongoId, IsInt, Min } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  reservationId!: string;

  @IsMongoId()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
