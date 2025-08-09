import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ContentfulService } from './contentful.service';
import { ProductsService } from '../products.service';
import { EntryCollection, createClient } from 'contentful';

jest.mock('contentful', () => ({
  createClient: jest.fn(),
}));

describe('ContentfulService', () => {
  let service: ContentfulService;
  let configService: jest.Mocked<ConfigService>;
  let productsService: jest.Mocked<ProductsService>;
  let mockContentfulClient: { getEntries: jest.Mock };

  const mockConfigValues = {
    CONTENTFUL_SPACE_ID: 'test-space-id',
    CONTENTFUL_ACCESS_TOKEN: 'test-access-token',
    CONTENTFUL_ENVIRONMENT: 'test-environment',
    CONTENTFUL_CONTENT_TYPE: 'product',
  };

  const mockContentfulEntries = {
    items: [
      {
        sys: {
          id: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        fields: { name: 'Test Product 1', category: 'Electronics', price: 100 },
      },
      {
        sys: {
          id: '2',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        fields: { name: 'Test Product 2', category: 'Books', price: null },
      },
      {
        sys: {
          id: '3',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
        },
        fields: { name: 'Test Product 3', category: 'Clothing' },
      },
    ],
  } as unknown as EntryCollection<any>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockContentfulClient = { getEntries: jest.fn() };
    (createClient as jest.Mock).mockReturnValue(mockContentfulClient);

    const mockConfigService = { get: jest.fn() };
    const mockProductsService = { syncProducts: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentfulService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<ContentfulService>(ContentfulService);
    configService = module.get(ConfigService);
    productsService = module.get(ProductsService);

    (configService.get as jest.Mock).mockImplementation(
      (key: string) => mockConfigValues[key as keyof typeof mockConfigValues],
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncContentfulData', () => {
    beforeEach(() => {
      service.onModuleInit();
      mockContentfulClient.getEntries.mockResolvedValue(mockContentfulEntries);
      (productsService.syncProducts as jest.Mock).mockResolvedValue(undefined);
    });

    it('should sync data successfully', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(function (this: void) {});

      await service.syncContentfulData();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Executing hourly sync from Contentful...',
      );
      expect(mockContentfulClient.getEntries).toHaveBeenCalledWith({
        content_type: 'product',
      });

      loggerSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(function (this: void) {});
      mockContentfulClient.getEntries.mockRejectedValue(new Error('API error'));

      await service.syncContentfulData();

      expect(loggerErrorSpy).toHaveBeenCalled();

      loggerErrorSpy.mockRestore();
    });

    it('should fail if client is not initialized', async () => {
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(function (this: void) {});
      (service as unknown as { client?: { getEntries: jest.Mock } }).client =
        undefined;

      await service.syncContentfulData();

      expect(loggerErrorSpy).toHaveBeenCalled();

      loggerErrorSpy.mockRestore();
    });
  });
});
