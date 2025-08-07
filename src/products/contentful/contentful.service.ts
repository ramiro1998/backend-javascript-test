import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'contentful';
import { ProductsService } from '../products.service';
import { ContentfulProductEntry } from './interfaces/contentful.interface';

@Injectable()
export class ContentfulService implements OnModuleInit {
    private readonly logger = new Logger(ContentfulService.name);
    private client;

    constructor(private configService: ConfigService, private productsService: ProductsService) { }

    onModuleInit() {
        const space = this.configService.get<string>('CONTENTFUL_SPACE_ID');
        const accessToken = this.configService.get<string>('CONTENTFUL_ACCESS_TOKEN');
        const environment = this.configService.get<string>('CONTENTFUL_ENVIRONMENT');

        if (!space || !accessToken || !environment) {
            throw new Error('Contentful credentials are not set in the environment variables.');
        }

        this.client = createClient({
            space: space,
            accessToken: accessToken,
            environment: environment,
        });
    }

    async getProducts() {
        try {
            this.logger.log('Fetching products from Contentful API...');
            const contentType = this.configService.get<string>('CONTENTFUL_CONTENT_TYPE');

            const entries = await this.client.getEntries({
                content_type: contentType,
            });

            const productsToSave = entries.items.map((item: ContentfulProductEntry) => {
                return {
                    id: item.sys.id,
                    ...item.fields,
                    price: item.fields.price ?? 0,
                    active: false,
                };
            });

            await this.productsService.saveProducts(productsToSave);

            this.logger.log(`Successfully fetched and saved ${productsToSave.length} products.`);
            return productsToSave;

        } catch (error) {
            this.logger.error('Error fetching data from Contentful:', error.message);
            return [];
        }
    }
}