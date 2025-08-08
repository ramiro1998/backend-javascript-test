import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [
        ProductsModule,
    ],
    providers: [
        CronService,
    ],
    exports: []
})
export class CronModule { }