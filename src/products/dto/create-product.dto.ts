import { IsString, IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0.01)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;
}
