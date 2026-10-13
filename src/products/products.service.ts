import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { Product } from './schemas/product.schema.js';
import { UpdateProductInput } from './graphql/update-product.input.js';

@Injectable()
export class ProductsService {
  // private readonly products = [
  //   { id: 1, name: 'Tylenol', price: 12.99, stock: 100 },
  //   { id: 2, name: 'Vitamin D3', price: 8.99, stock: 50 },
  //   { id: 3, name: 'Accu-Chek Test Strips', price: 29.99, stock: 25 },
  // ];

  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async findAll() {
    return this.productModel.find().exec();
  }

  async findProductById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Product not found');
    }

    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(createProductDto: CreateProductDto) {
    return this.productModel.create(createProductDto);
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid product ID: ${id}`);
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        { $set: input },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid product ID: ${id}`);
    }

    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

    if (!deletedProduct) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    return true;
  }
}
