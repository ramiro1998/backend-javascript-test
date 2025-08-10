import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { ReportActiveDto } from './dto/report-active.dto';
import { ReportDeletedByCategoryDto } from './dto/report-deleted-by-category.dto';

@Injectable()
export class AdminService {
  constructor(private productsService: ProductsService) { }

  async getDeletedProductsPercentage() {
    try {
      const totalProducts = await this.productsService.countAllProducts();
      const deletedProducts = await this.productsService.countDeletedProducts();
      const percentageDeleted = (deletedProducts / totalProducts) * 100;
      return { percentageDeleted };
    } catch (error) {
      throw new InternalServerErrorException('Error getting deleted products percentage');
    }
  }

  async getActiveProductsReport(filters: ReportActiveDto) {
    try {
      return await this.productsService.getActiveProductsReport(filters);
    } catch (error) {
      throw new InternalServerErrorException('Error getting active products report');
    }
  }

  async getDeletedPercentageByCategory(filters: ReportDeletedByCategoryDto) {
    try {
      return await this.productsService.getDeletedPercentageByCategoryInDateRange(filters);
    } catch (error) {
      throw new InternalServerErrorException('Error getting deleted percentage by category');
    }
  }
}
