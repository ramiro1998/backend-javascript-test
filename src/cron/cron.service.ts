import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContentfulService } from 'src/products/contentful/contentful.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly contentfulService: ContentfulService) {}

  @Cron('0 * * * *')
  async handleCron() {
    this.logger.log('Syncing products...');
    await this.contentfulService.syncContentfulData();
    this.logger.log('Products synchronized successfully.');
  }
}
