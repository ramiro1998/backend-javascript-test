import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<Product>>;

  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    category: 'Electronics',
    brand: 'Dell',
    color: 'White',
    currency: 'USD',
    model: 'Bk7',
    sku: '51JOP76',
    stock: 2,
    price: 100,
    softDeletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
        getCount: jest.fn().mockResolvedValue(1),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncProducts', () => {
    it('should sync products from external source', async () => {
      const externalProducts = [
        { id: '1', name: 'Updated Product', category: 'Electronics', price: 120 },
      ];

      repository.find.mockResolvedValue([mockProduct]);
      repository.upsert.mockResolvedValue(undefined as any);

      await service.syncProducts(externalProducts);

      expect(repository.find).toHaveBeenCalled();
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'Updated Product',
            softDeletedAt: null
          })
        ]),
        ['id']
      );
    });

    it('should handle empty product list', async () => {
      repository.find.mockResolvedValue([]);

      await service.syncProducts([]);

      expect(repository.find).toHaveBeenCalled();
      expect(repository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteMany', () => {
    it('should soft delete products by IDs', async () => {
      const idsToDelete = ['1'];
      repository.find.mockResolvedValue([mockProduct]);
      repository.update.mockResolvedValue(undefined as any);

      const result = await service.softDeleteMany(idsToDelete);

      expect(repository.find).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.anything() }),
        expect.objectContaining({ softDeletedAt: expect.any(Date) })
      );
      expect(result.deletedIds).toEqual(['1']);
    });

    it('should handle non-existent product IDs', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.softDeleteMany(['nonexistent']);

      expect(result.notFoundIds).toEqual(['nonexistent']);
      expect(result.deletedIds).toEqual([]);
    });
  });

  describe('findProductsPaginated', () => {
    it('should return paginated products with default settings', async () => {
      const result = await service.findProductsPaginated({}, {});

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        products: [mockProduct],
        total: 1
      });
    });

    it('should apply pagination parameters', async () => {
      const queryBuilder = repository.createQueryBuilder();

      await service.findProductsPaginated({ page: 2, limit: 10 }, {});

      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply name filter', async () => {
      const queryBuilder = repository.createQueryBuilder();

      await service.findProductsPaginated({}, { name: 'Test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(product.name) LIKE :name',
        { name: '%test%' }
      );
    });

    it('should apply category filter', async () => {
      const queryBuilder = repository.createQueryBuilder();

      await service.findProductsPaginated({}, { category: 'Electronics' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(product.category) = :category',
        { category: 'electronics' }
      );
    });
  });

  describe('countAllProducts', () => {
    it('should return total product count', async () => {
      repository.count.mockResolvedValue(100);

      const result = await service.countAllProducts();

      expect(repository.count).toHaveBeenCalled();
      expect(result).toBe(100);
    });
  });

  describe('countDeletedProducts', () => {
    it('should return deleted product count', async () => {
      repository.count.mockResolvedValue(25);

      const result = await service.countDeletedProducts();

      expect(repository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            softDeletedAt: expect.anything()
          })
        })
      );
      expect(result).toBe(25);
    });
  });

  describe('getActiveProductsReport', () => {
    it('should return percentage of active products', async () => {
      const queryBuilder: any = repository.createQueryBuilder();
      queryBuilder.getCount.mockResolvedValue(80);
      repository.count.mockResolvedValue(100);

      const result = await service.getActiveProductsReport({});

      expect(result).toEqual({ percentageNonDeleted: 80 });
    });

    it('should handle zero total products', async () => {
      const queryBuilder: any = repository.createQueryBuilder();
      queryBuilder.getCount.mockResolvedValue(0);
      repository.count.mockResolvedValue(0);

      const result = await service.getActiveProductsReport({});

      expect(result).toEqual({ percentageNonDeleted: 0 });
    });
  });

  describe('getDeletedPercentageByCategoryInDateRange', () => {
    it('should return percentage of deleted products by category', async () => {
      repository.count
        .mockResolvedValueOnce(100) // total in category
        .mockResolvedValueOnce(20); // deleted in date range

      const result = await service.getDeletedPercentageByCategoryInDateRange({
        category: 'Electronics',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(repository.count).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ percentageDeleted: 20 });
    });

    it('should handle zero category products', async () => {
      repository.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getDeletedPercentageByCategoryInDateRange({
        category: 'NonExistent',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result).toEqual({ percentageDeleted: 0 });
    });
  });
});