import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterDto } from 'src/common/dto/filter.dto';

@Injectable()
export class ProductsService {

  constructor(@InjectRepository(Product)
  private productsRepository: Repository<Product>,) { }

  async syncProducts(productsFromContentful: Partial<Product>[], forceReactivate: boolean = false): Promise<void> {
    const contentfulIds = productsFromContentful.map(p => p.id);
    const existingProducts = await this.productsRepository.find();
    const existingProductsMap = new Map(existingProducts.map(p => [p.id, p]));

    const productsWithIds = productsFromContentful.filter(p => p.id);

    const productsToUpsert = productsWithIds.map(p => {
      const existing = existingProductsMap.get(p.id!);

      const softDeletedAt = forceReactivate ? null : (existing?.softDeletedAt || null);

      return {
        ...p,
        softDeletedAt,
      } as Partial<Product>;;
    });

    const productsToDeactivate = existingProducts
      .filter(p => !contentfulIds.includes(p.id) && p.softDeletedAt)
      .map(p => ({ ...p, softDeletedAt: new Date() }));

    if (productsToUpsert.length > 0) {
      await this.productsRepository.upsert(productsToUpsert, ['id']);
    }

    if (productsToDeactivate.length > 0) {
      await this.productsRepository.save(productsToDeactivate);
    }
  }

  async softDeleteMany(ids: string[]): Promise<void> {
    await this.productsRepository.update(
      { id: In(ids) },
      { softDeletedAt: new Date() },
    );
  }

  async findProductsPaginated(paginationDto: PaginationDto, filterDto: FilterDto): Promise<{ products: Product[]; total: number }> {
    const { page = 1, limit = 5 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productsRepository.createQueryBuilder('product');

    queryBuilder.where('product.softDeletedAt IS NULL');

    if (filterDto.name) {
      queryBuilder.andWhere('product.name LIKE :name', { name: `%${filterDto.name}%` });
    }
    if (filterDto.category) {
      queryBuilder.andWhere('product.category = :category', { category: filterDto.category });
    }
    if (filterDto.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filterDto.minPrice });
    }
    if (filterDto.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filterDto.maxPrice });
    }

    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return { products, total };
  }
}
