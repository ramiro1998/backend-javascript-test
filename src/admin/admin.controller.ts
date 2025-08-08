import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ContentfulService } from 'src/products/contentful/contentful.service';
import { ProductsService } from 'src/products/products.service';
import { AuthGuard } from '@nestjs/passport';
import { DeleteManyDto } from 'src/products/dto/delet-many.dto';

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
    await this.productsService.softDeleteMany(ids);
    return { message: 'Products deleted successfully.' };
  }

  @Get('reports/deleted-percentage')
  @UseGuards(AuthGuard('jwt'))
  async getDeletedProductsPercentage() {
    return { percentage: await this.adminService.getDeletedProductsPercentage() };
  }

  @Get('reports/active-by-price-status')
  @UseGuards(AuthGuard('jwt'))
  async getActiveProductsByPriceStatus() {
    return await this.adminService.getActiveProductsByPriceStatus();
  }
}