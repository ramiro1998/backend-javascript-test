import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class AdminService {

  constructor(private productsService: ProductsService) { }

  async getDeletedProductsPercentage()/* : Promise<number> */ {
    // const totalProducts = await this.productsService.countAllProducts();
    // const deletedProducts = await this.productsService.countDeletedProducts();
    // return (deletedProducts / totalProducts) * 100;
  }

  async getActiveProductsByPriceStatus()/* : Promise<{ withPrice: number; withoutPrice: number }> */ {
    // const activeProductsWithPrice = await this.productsService.countActiveProductsByPrice(true);
    // const activeProductsWithoutPrice = await this.productsService.countActiveProductsByPrice(false);
    // const totalActiveProducts = activeProductsWithPrice + activeProductsWithoutPrice;

    // return {
    //   withPrice: (activeProductsWithPrice / totalActiveProducts) * 100,
    //   withoutPrice: (activeProductsWithoutPrice / totalActiveProducts) * 100,
    // };
  }

}
