import { Controller, Get, Query, Param, Delete, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterDto } from 'src/common/dto/filter.dto';
import { DeleteManyDto } from './dto/delet-many.dto';

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