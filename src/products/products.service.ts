import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');
  onModuleInit() {
    this.$connect();

    this.logger.log('Prisma connected');
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({ data: createProductDto });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: { available: true },
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }

    return product;
  }

  // async update(id: number, updateProductDto: UpdateProductDto) {
  //   await this.findOne(id);

  //   return this.product.update({
  //     where: { id },
  //     data: updateProductDto,
  //   });
  // }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: __, ...data } = updateProductDto;

    if (Object.keys(updateProductDto).length === 0) {
      throw new BadRequestException('No data to update');
    }
    try {
      return await this.product.update({
        where: { id },
        data: data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Product with id #${id} not found, update failed`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.product.update({
        where: { id },
        data: { available: false },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Product with id #${id} not found, delete failed`,
        );
      }
      throw error;
    }
  }
}
