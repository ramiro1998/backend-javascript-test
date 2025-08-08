import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { ReportActiveDto } from './dto/report-active.dto';
import { ReportDeletedByCategoryDto } from './dto/report-deleted-by-category.dto';

@Injectable()
export class AdminService {

  constructor(private productsService: ProductsService) { }

  async getDeletedProductsPercentage() {
    const totalProducts = await this.productsService.countAllProducts();
    const deletedProducts = await this.productsService.countDeletedProducts();
    const percentageDeleted = (deletedProducts / totalProducts) * 100;
    return { percentageDeleted }
  }

  async getActiveProductsReport(filters: ReportActiveDto) {
    return this.productsService.getActiveProductsReport(filters)
  }


  async getDeletedPercentageByCategory(filters: ReportDeletedByCategoryDto) {
    return this.productsService.getDeletedPercentageByCategoryInDateRange(filters)
  }

}
