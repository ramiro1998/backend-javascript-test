import { Injectable, OnModuleInit } from '@nestjs/common';
import { ContentfulService } from './products/contentful/contentful.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly contentfulService: ContentfulService) { }

  async onModuleInit() {
    console.log('Application has been initialized. Fetching data from Contentful...');
    await this.contentfulService.getProducts();
  }

  getHello(): string {
    return 'Hello World!';
  }
}