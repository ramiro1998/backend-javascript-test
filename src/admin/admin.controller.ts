import { Controller, Get, Post, Body, Delete, HttpCode, UseGuards, HttpStatus, HttpException, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ContentfulService } from 'src/products/contentful/contentful.service';
import { ProductsService } from 'src/products/products.service';
import { AuthGuard } from '@nestjs/passport';
import { DeleteManyDto } from 'src/products/dto/delete-many.dto';
import { ReportActiveDto } from './dto/report-active.dto';
import { ReportDeletedByCategoryDto } from './dto/report-deleted-by-category.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private contentfulService: ContentfulService, private productsService: ProductsService) { }

  @Post('seed')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async syncData() {
    await this.contentfulService.syncContentfulData(true);
    return { message: 'Seed executed successfully.' };
  }

  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @Delete('products')
  async deleteMany(@Body() { ids }: DeleteManyDto) {
    const result = await this.productsService.softDeleteMany(ids);

    if (result.deletedIds.length === 0 && result.alreadyDeletedIds.length === 0) {
      throw new HttpException('No products found to delete.', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Soft delete operation completed.',
      deleted: result.deletedIds,
      notFound: result.notFoundIds,
      alreadyDeleted: result.alreadyDeletedIds,
    };
  }


  @Get('reports/deleted-percentage')
  @UseGuards(AuthGuard('jwt'))
  async getDeletedProductsPercentage() {
    return await this.adminService.getDeletedProductsPercentage();
  }

  @Get('reports/non-deleted-percentage')
  @UseGuards(AuthGuard('jwt'))
  async getActiveProductsByPriceStatus(@Query() filters: ReportActiveDto) {
    return await this.adminService.getActiveProductsReport(filters);
  }

  @Get('reports/deleted-percentage-by-category')
  @UseGuards(AuthGuard('jwt'))
  async getDeletedByCategoryReport(@Query() filters: ReportDeletedByCategoryDto) {
    return this.adminService.getDeletedPercentageByCategory(filters);
  }
}