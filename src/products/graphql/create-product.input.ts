import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  price!: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  stock!: number;
}
