import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterDto } from 'src/common/dto/filter.dto';
import { ReportActiveDto } from 'src/admin/dto/report-active.dto';
import { ReportDeletedByCategoryDto } from 'src/admin/dto/report-deleted-by-category.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) { }

  async syncProducts(
    productsFromContentful: Partial<Product>[],
    forceReactivate: boolean = false,
  ): Promise<void> {
    try {
      const contentfulIds = productsFromContentful.map((p) => p.id);
      const existingProducts = await this.productsRepository.find();
      const existingProductsMap = new Map(existingProducts.map((p) => [p.id, p]));

      const productsWithIds = productsFromContentful.filter((p) => p.id);

      const productsToUpsert = productsWithIds.map((p) => {
        const existing = existingProductsMap.get(p.id!);

        const softDeletedAt = forceReactivate
          ? null
          : existing?.softDeletedAt || null;

        return {
          ...p,
          softDeletedAt,
        } as Partial<Product>;
      });

      const productsToDeactivate = existingProducts
        .filter((p) => !contentfulIds.includes(p.id) && p.softDeletedAt)
        .map((p) => ({ ...p, softDeletedAt: new Date() }));

      if (productsToUpsert.length > 0) {
        await this.productsRepository.upsert(productsToUpsert, ['id']);
      }

      if (productsToDeactivate.length > 0) {
        await this.productsRepository.save(productsToDeactivate);
      }
    } catch (error) {
      this.logger.error('Error syncing products', error.stack);
      throw new InternalServerErrorException('Error syncing products');
    }
  }

  async softDeleteMany(ids: string[]) {
    try {
      const products = await this.productsRepository.find({
        where: { id: In(ids) },
      });

      const foundIds = products.map((p) => p.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      const productsToDelete = products.filter((p) => p.softDeletedAt === null);
      const alreadyDeletedIds = products
        .filter((p) => p.softDeletedAt !== null)
        .map((p) => p.id);

      if (productsToDelete.length > 0) {
        await this.productsRepository.update(
          { id: In(productsToDelete.map((p) => p.id)) },
          { softDeletedAt: new Date() },
        );
      }

      const deletedIds = productsToDelete.map((p) => p.id);
      return { deletedIds, notFoundIds, alreadyDeletedIds };
    } catch (error) {
      this.logger.error('Error soft deleting products', error.stack);
      throw new InternalServerErrorException('Error deleting products');
    }
  }

  async findProductsPaginated(
    paginationDto: PaginationDto,
    filterDto: FilterDto,
  ) {
    try {
      const { page = 1, limit = 5 } = paginationDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.productsRepository.createQueryBuilder('product');
      queryBuilder.where('product.softDeletedAt IS NULL');

      if (filterDto.name) {
        queryBuilder.andWhere('LOWER(product.name) LIKE :name', {
          name: `%${filterDto.name.toLowerCase()}%`,
        });
      }
      if (filterDto.category) {
        queryBuilder.andWhere('LOWER(product.category) = :category', {
          category: filterDto.category.toLowerCase(),
        });
      }
      if (filterDto.minPrice) {
        queryBuilder.andWhere('product.price >= :minPrice', {
          minPrice: filterDto.minPrice,
        });
      }
      if (filterDto.maxPrice) {
        queryBuilder.andWhere('product.price <= :maxPrice', {
          maxPrice: filterDto.maxPrice,
        });
      }

      queryBuilder.skip(skip).take(limit);
      const [products, total] = await queryBuilder.getManyAndCount();
      return { products, total };
    } catch (error) {
      this.logger.error('Error fetching paginated products', error.stack);
      throw new InternalServerErrorException('Error fetching products');
    }
  }

  async countAllProducts(): Promise<number> {
    try {
      return await this.productsRepository.count();
    } catch (error) {
      this.logger.error('Error counting all products', error.stack);
      throw new InternalServerErrorException('Error counting products');
    }
  }

  async countDeletedProducts(): Promise<number> {
    try {
      return await this.productsRepository.count({
        where: { softDeletedAt: Not(IsNull()) },
      });
    } catch (error) {
      this.logger.error('Error counting deleted products', error.stack);
      throw new InternalServerErrorException('Error counting deleted products');
    }
  }

  async getActiveProductsReport(
    filters: ReportActiveDto,
  ): Promise<{ percentageNonDeleted: number }> {
    try {
      const queryBuilder = this.productsRepository.createQueryBuilder('product');
      queryBuilder.where('product.softDeletedAt IS NULL');

      if (filters.hasPrice !== undefined) {
        if (filters.hasPrice === 'true') {
          queryBuilder.andWhere('product.price IS NOT NULL');
        } else if (filters.hasPrice === 'false') {
          queryBuilder.andWhere('product.price IS NULL');
        }
      }

      if (filters.from && filters.to) {
        const fromDate = new Date(`${filters.from}T00:00:00.000Z`);
        const toDate = new Date(`${filters.to}T23:59:59.999Z`);

        queryBuilder.andWhere(
          'product.updatedAt BETWEEN :fromDate AND :toDate',
          { fromDate, toDate },
        );
      }

      const totalMatchingCount = await queryBuilder.getCount();
      const totalProducts = await this.productsRepository.count();
      const percentage =
        totalProducts > 0 ? (totalMatchingCount / totalProducts) * 100 : 0;

      return { percentageNonDeleted: percentage };
    } catch (error) {
      this.logger.error('Error generating active products report', error.stack);
      throw new InternalServerErrorException(
        'Error generating active products report',
      );
    }
  }

  async getDeletedPercentageByCategoryInDateRange(
    filters: ReportDeletedByCategoryDto,
  ): Promise<{ percentageDeleted: number }> {
    try {
      const queryBuilder = this.productsRepository.createQueryBuilder('product');

      if (filters.category) {
        queryBuilder.andWhere('product.category = :category', {
          category: filters.category,
        });
      }

      if (filters.from && filters.to) {
        const fromDate = new Date(`${filters.from}T00:00:00.000Z`);
        const toDate = new Date(`${filters.to}T23:59:59.999Z`);
        queryBuilder.andWhere('product.softDeletedAt BETWEEN :from AND :to', {
          from: fromDate,
          to: toDate,
        });
      }

      const totalProducts = await this.productsRepository.count();
      const deletedProducts = await queryBuilder
        .andWhere('product.softDeletedAt IS NOT NULL')
        .getCount();

      const percentage =
        totalProducts > 0 ? (deletedProducts / totalProducts) * 100 : 0;

      return { percentageDeleted: percentage };
    } catch (error) {
      this.logger.error(
        'Error calculating deleted percentage by category',
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error calculating deleted percentage by category',
      );
    }
  }
}
