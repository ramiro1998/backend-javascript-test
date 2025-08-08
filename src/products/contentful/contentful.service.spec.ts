import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ContentfulService } from './contentful.service';
import { ProductsService } from '../products.service';

jest.mock('contentful', () => ({
  createClient: jest.fn(),
}));

import { createClient } from 'contentful';

describe('ContentfulService', () => {
  let service: ContentfulService;
  let configService: jest.Mocked<ConfigService>;
  let productsService: jest.Mocked<ProductsService>;
  let mockContentfulClient: any;

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
        fields: {
          name: 'Test Product 1',
          category: 'Electronics',
          price: 100,
        },
      },
      {
        sys: {
          id: '2',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        fields: {
          name: 'Test Product 2',
          category: 'Books',
          price: null
        },
      },
      {
        sys: {
          id: '3',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
        },
        fields: {
          name: 'Test Product 3',
          category: 'Clothing',
        },
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockContentfulClient = {
      getEntries: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockContentfulClient);

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockProductsService = {
      syncProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentfulService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<ContentfulService>(ContentfulService);
    configService = module.get(ConfigService);
    productsService = module.get(ProductsService);

    configService.get.mockImplementation((key: string) => mockConfigValues[key]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize Contentful client with correct configuration', () => {
      service.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('CONTENTFUL_SPACE_ID');
      expect(configService.get).toHaveBeenCalledWith('CONTENTFUL_ACCESS_TOKEN');
      expect(configService.get).toHaveBeenCalledWith('CONTENTFUL_ENVIRONMENT');

      expect(createClient).toHaveBeenCalledWith({
        space: 'test-space-id',
        accessToken: 'test-access-token',
        environment: 'test-environment',
      });
    });

    it('should throw error when CONTENTFUL_SPACE_ID is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CONTENTFUL_SPACE_ID') return undefined;
        return mockConfigValues[key];
      });

      expect(() => service.onModuleInit()).toThrow(
        'Contentful credentials are not set in the environment variables.'
      );
    });

    it('should throw error when CONTENTFUL_ACCESS_TOKEN is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CONTENTFUL_ACCESS_TOKEN') return undefined;
        return mockConfigValues[key];
      });

      expect(() => service.onModuleInit()).toThrow(
        'Contentful credentials are not set in the environment variables.'
      );
    });

    it('should throw error when CONTENTFUL_ENVIRONMENT is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CONTENTFUL_ENVIRONMENT') return undefined;
        return mockConfigValues[key];
      });

      expect(() => service.onModuleInit()).toThrow(
        'Contentful credentials are not set in the environment variables.'
      );
    });

    it('should throw error when all credentials are missing', () => {
      configService.get.mockReturnValue(undefined);

      expect(() => service.onModuleInit()).toThrow(
        'Contentful credentials are not set in the environment variables.'
      );
    });
  });

  describe('syncContentfulData', () => {
    beforeEach(() => {
      service.onModuleInit();
      mockContentfulClient.getEntries.mockResolvedValue(mockContentfulEntries);
      productsService.syncProducts.mockResolvedValue(undefined);
    });

    it('should sync data successfully with default parameters (forceReactivate = false)', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await service.syncContentfulData();

      expect(loggerSpy).toHaveBeenCalledWith('Executing hourly sync from Contentful...');
      expect(mockContentfulClient.getEntries).toHaveBeenCalledWith({
        content_type: 'product',
      });

      expect(productsService.syncProducts).toHaveBeenCalledWith(
        [
          {
            id: '1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            name: 'Test Product 1',
            category: 'Electronics',
            price: 100,
          },
          {
            id: '2',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            name: 'Test Product 2',
            category: 'Books',
            price: null,
          },
          {
            id: '3',
            createdAt: '2024-01-03T00:00:00Z',
            updatedAt: '2024-01-03T00:00:00Z',
            name: 'Test Product 3',
            category: 'Clothing',
            price: null,
          },
        ],
        false
      );

      expect(loggerSpy).toHaveBeenCalledWith('hourly sync finished. 3 products processed.');

      loggerSpy.mockRestore();
    });

    it('should sync data successfully with forceReactivate = true', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await service.syncContentfulData(true);

      expect(loggerSpy).toHaveBeenCalledWith('Executing initial seed from Contentful...');
      expect(productsService.syncProducts).toHaveBeenCalledWith(
        expect.any(Array),
        true
      );
      expect(loggerSpy).toHaveBeenCalledWith('initial seed finished. 3 products processed.');

      loggerSpy.mockRestore();
    });

    it('should handle empty entries from Contentful', async () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      mockContentfulClient.getEntries.mockResolvedValue({ items: [] });

      await service.syncContentfulData();

      expect(productsService.syncProducts).toHaveBeenCalledWith([], false);
      expect(loggerSpy).toHaveBeenCalledWith('hourly sync finished. 0 products processed.');

      loggerSpy.mockRestore();
    });

    it('should handle entries with missing price field', async () => {
      const entriesWithMissingPrice = {
        items: [
          {
            sys: {
              id: '1',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            fields: {
              name: 'Product Without Price',
              category: 'Electronics',
            },
          },
        ],
      };

      mockContentfulClient.getEntries.mockResolvedValue(entriesWithMissingPrice);

      await service.syncContentfulData();

      expect(productsService.syncProducts).toHaveBeenCalledWith(
        [
          {
            id: '1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            name: 'Product Without Price',
            category: 'Electronics',
            price: null,
          },
        ],
        false
      );
    });

    it('should handle Contentful API errors gracefully', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const contentfulError = new Error('Contentful API rate limit exceeded');

      mockContentfulClient.getEntries.mockRejectedValue(contentfulError);

      await service.syncContentfulData();

      expect(loggerLogSpy).toHaveBeenCalledWith('Executing hourly sync from Contentful...');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error during hourly sync:',
        'Contentful API rate limit exceeded'
      );
      expect(productsService.syncProducts).not.toHaveBeenCalled();

      loggerErrorSpy.mockRestore();
      loggerLogSpy.mockRestore();
    });

    it('should handle ProductsService errors gracefully', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const productsServiceError = new Error('Database connection failed');

      productsService.syncProducts.mockRejectedValue(productsServiceError);

      await service.syncContentfulData(true);

      expect(loggerLogSpy).toHaveBeenCalledWith('Executing initial seed from Contentful...');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error during initial seed:',
        'Database connection failed'
      );

      loggerErrorSpy.mockRestore();
      loggerLogSpy.mockRestore();
    });

    it('should use correct content type from configuration', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'CONTENTFUL_CONTENT_TYPE') return 'custom-product-type';
        return mockConfigValues[key];
      });

      await service.syncContentfulData();

      expect(mockContentfulClient.getEntries).toHaveBeenCalledWith({
        content_type: 'custom-product-type',
      });
    });

    it('should properly transform Contentful entries to product format', async () => {
      const complexEntry = {
        items: [
          {
            sys: {
              id: 'complex-id-123',
              createdAt: '2024-06-15T14:30:00.000Z',
              updatedAt: '2024-06-16T09:15:00.000Z',
            },
            fields: {
              name: 'Complex Product Name',
              category: 'Advanced Electronics',
              price: 299.99,
              description: 'A complex product description',
              inStock: true,
            },
          },
        ],
      };

      mockContentfulClient.getEntries.mockResolvedValue(complexEntry);

      await service.syncContentfulData();

      expect(productsService.syncProducts).toHaveBeenCalledWith(
        [
          {
            id: 'complex-id-123',
            createdAt: '2024-06-15T14:30:00.000Z',
            updatedAt: '2024-06-16T09:15:00.000Z',
            name: 'Complex Product Name',
            category: 'Advanced Electronics',
            price: 299.99,
            description: 'A complex product description',
            inStock: true,
          },
        ],
        false
      );
    });

    it('should handle network timeout errors', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockContentfulClient.getEntries.mockRejectedValue(timeoutError);

      await service.syncContentfulData();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error during hourly sync:',
        'Request timeout'
      );

      loggerErrorSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle the complete flow from initialization to sync', async () => {
      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      service.onModuleInit();

      mockContentfulClient.getEntries.mockResolvedValue(mockContentfulEntries);
      await service.syncContentfulData();

      expect(createClient).toHaveBeenCalledWith({
        space: 'test-space-id',
        accessToken: 'test-access-token',
        environment: 'test-environment',
      });

      expect(productsService.syncProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '1' }),
          expect.objectContaining({ id: '2' }),
          expect.objectContaining({ id: '3' }),
        ]),
        false
      );

      loggerLogSpy.mockRestore();
    });

    it('should fail gracefully if client is not initialized', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await service.syncContentfulData();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Error during hourly sync:',
        expect.stringContaining('Cannot read')
      );

      loggerErrorSpy.mockRestore();
    });
  });
});