import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterDto } from 'src/common/dto/filter.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: FilterDto,
  ) {
    return this.productsService.findProductsPaginated(paginationDto, filterDto);
  }

}