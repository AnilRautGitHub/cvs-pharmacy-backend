import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  price!: number;

  @Field(() => Int)
  stock!: number;
}
