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

    async syncContentfulData(forceReactivate: boolean = false): Promise<void> {
        const syncType = forceReactivate ? 'initial seed' : 'hourly sync';
        try {
            this.logger.log(`Executing ${syncType} from Contentful...`);
            const entries = await this.client.getEntries({
                content_type: this.configService.get<string>('CONTENTFUL_CONTENT_TYPE'),
            });

            const productsToProcess = entries.items.map((item: ContentfulProductEntry) => ({
                id: item.sys.id,
                ...item.fields,
                price: item.fields.price ?? null,
            }));

            await this.productsService.syncProducts(productsToProcess, forceReactivate);
            this.logger.log(`${syncType} finished. ${productsToProcess.length} products processed.`);
        } catch (error) {
            this.logger.error(`Error during ${syncType}:`, error.message);
        }
    }
}