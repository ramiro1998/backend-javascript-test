import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  HttpCode,
  UseGuards,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ContentfulService } from 'src/products/contentful/contentful.service';
import { ProductsService } from 'src/products/products.service';
import { AuthGuard } from '@nestjs/passport';
import { DeleteManyDto } from 'src/products/dto/delete-many.dto';
import { ReportActiveDto } from './dto/report-active.dto';
import { ReportDeletedByCategoryDto } from './dto/report-deleted-by-category.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private contentfulService: ContentfulService,
    private productsService: ProductsService,
  ) {}

  @Post('seed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Seeding data for data population' })
  @ApiResponse({ status: 200, description: 'Seed executed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async seedData() {
    await this.contentfulService.syncContentfulData(true);
    return { message: 'Seed executed successfully.' };
  }

  @Delete('products')
  @HttpCode(200)
  @ApiOperation({ summary: 'Soft deleting of products ' })
  @ApiResponse({ status: 200, description: 'Soft delete operation completed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({ type: DeleteManyDto })
  async deleteMany(@Body() { ids }: DeleteManyDto) {
    const result = await this.productsService.softDeleteMany(ids);

    if (
      result.deletedIds.length === 0 &&
      result.alreadyDeletedIds.length === 0
    ) {
      throw new HttpException(
        'No products found to delete.',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      message: 'Soft delete operation completed.',
      deleted: result.deletedIds,
      notFound: result.notFoundIds,
      alreadyDeleted: result.alreadyDeletedIds,
    };
  }

  @Get('reports/deleted-percentage')
  @ApiOperation({ summary: 'Percentage of deleted products.' })
  @ApiResponse({ status: 200, description: 'percentageDeleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getDeletedProductsPercentage() {
    return await this.adminService.getDeletedProductsPercentage();
  }

  @Get('reports/non-deleted-percentage')
  @ApiOperation({ summary: 'Percentage of non-deleted products.' })
  @ApiResponse({ status: 200, description: 'percentageNonDeleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({
    name: 'hasPrice',
    required: false,
    enum: ['true', 'false'],
    description: 'Filter by products with or without a price.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Filter by updated date (YYYY-MM-DD).',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2024-03-31',
    description: 'Filter by updated date (YYYY-MM-DD).',
  })
  async getActiveProductsByPriceStatus(@Query() filters: ReportActiveDto) {
    return await this.adminService.getActiveProductsReport(filters);
  }

  @Get('reports/deleted-percentage-by-category')
  @ApiOperation({ summary: 'Percentage of deleted products by category.' })
  @ApiResponse({ status: 200, description: 'percentageDeleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter products by category.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2024-01-01',
    description: 'Filter by updated date (YYYY-MM-DD).',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2024-03-31',
    description: 'Filter by updated date (YYYY-MM-DD).',
  })
  async getDeletedByCategoryReport(
    @Query() filters: ReportDeletedByCategoryDto,
  ) {
    return this.adminService.getDeletedPercentageByCategory(filters);
  }
}
