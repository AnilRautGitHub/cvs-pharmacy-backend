import { Args, ID, Query, Resolver, Mutation } from '@nestjs/graphql';
import { ProductsService } from './products.service.js';
import { ProductType } from './graphql/product.type.js';
import { CreateProductInput } from './graphql/create-product.input.js';
import { UpdateProductInput } from './graphql/update-product.input.js';
import { UseFilters } from '@nestjs/common';
import { GraphqlExceptionFilter } from '../common/filters/graphql-exception.filter.js';

@Resolver(() => ProductType)
@UseFilters(GraphqlExceptionFilter)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [ProductType], { name: 'products' })
  async getProducts(): Promise<ProductType[]> {
    const products = await this.productsService.findAll();

    return products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      stock: product.stock,
    }));
  }

  @Query(() => ProductType, { name: 'product' })
  async getProductById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProductType> {
    const product = await this.productsService.findProductById(id);

    return {
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      stock: product.stock,
    };
  }

  @Mutation(() => ProductType, { name: 'createProduct' })
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<ProductType> {
    const product = await this.productsService.createProduct(input);

    return {
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      stock: product.stock,
    };
  }

  @Mutation(() => ProductType, { name: 'updateProduct' })
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<ProductType> {
    const updatedProduct = await this.productsService.updateProduct(id, input);

    return {
      id: updatedProduct._id.toString(),
      name: updatedProduct.name,
      price: updatedProduct.price,
      stock: updatedProduct.stock,
    };
  }

  @Mutation(() => Boolean, { name: 'deleteProduct' })
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.productsService.deleteProduct(id);
  }
}
