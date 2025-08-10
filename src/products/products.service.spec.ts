import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ProductsService', () => {
  let service: ProductsService;

  let mockFind: jest.Mock;
  let mockSave: jest.Mock;
  let mockUpsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockCount: jest.Mock;
  let mockCreateQueryBuilder: jest.Mock;

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
    mockFind = jest.fn();
    mockSave = jest.fn();
    mockUpsert = jest.fn();
    mockUpdate = jest.fn();
    mockCount = jest.fn();
    mockCreateQueryBuilder = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      getCount: jest.fn().mockResolvedValue(1),
    });

    const mockRepository = {
      find: mockFind,
      save: mockSave,
      upsert: mockUpsert,
      update: mockUpdate,
      count: mockCount,
      createQueryBuilder: mockCreateQueryBuilder,
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
        {
          id: '1',
          name: 'Updated Product',
          category: 'Electronics',
          price: 120,
        },
      ];

      mockFind.mockResolvedValue([mockProduct]);
      mockUpsert.mockResolvedValue(undefined as any);

      await service.syncProducts(externalProducts);

      expect(mockFind).toHaveBeenCalled();
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'Updated Product',
            softDeletedAt: null,
          }),
        ]),
        ['id'],
      );
    });

    it('should handle empty product list', async () => {
      mockFind.mockResolvedValue([]);

      await service.syncProducts([]);

      expect(mockFind).toHaveBeenCalled();
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteMany', () => {
    it('should soft delete products by IDs', async () => {
      const idsToDelete = ['1'];
      mockFind.mockResolvedValue([mockProduct]);
      mockUpdate.mockResolvedValue(undefined as any);

      const result = await service.softDeleteMany(idsToDelete);

      expect(mockFind).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.anything() }),
        expect.objectContaining({ softDeletedAt: expect.any(Date) }),
      );
      expect(result.deletedIds).toEqual(['1']);
    });

    it('should handle non-existent product IDs', async () => {
      mockFind.mockResolvedValue([]);

      const result = await service.softDeleteMany(['nonexistent']);

      expect(result.notFoundIds).toEqual(['nonexistent']);
      expect(result.deletedIds).toEqual([]);
    });
  });

  describe('findProductsPaginated', () => {
    it('should return paginated products with default settings', async () => {
      const result = await service.findProductsPaginated({}, {});

      expect(mockCreateQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        products: [mockProduct],
        total: 1,
      });
    });

    it('should apply pagination parameters', async () => {
      const queryBuilder = mockCreateQueryBuilder();

      await service.findProductsPaginated({ page: 2, limit: 10 }, {});

      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply name filter', async () => {
      const queryBuilder = mockCreateQueryBuilder();

      await service.findProductsPaginated({}, { name: 'Test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(product.name) LIKE :name',
        { name: '%test%' },
      );
    });

    it('should apply category filter', async () => {
      const queryBuilder = mockCreateQueryBuilder();

      await service.findProductsPaginated({}, { category: 'Electronics' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(product.category) = :category',
        { category: 'electronics' },
      );
    });
  });

  describe('countAllProducts', () => {
    it('should return total product count', async () => {
      mockCount.mockResolvedValue(100);

      const result = await service.countAllProducts();

      expect(mockCount).toHaveBeenCalled();
      expect(result).toBe(100);
    });
  });

  describe('countDeletedProducts', () => {
    it('should return deleted product count', async () => {
      mockCount.mockResolvedValue(25);

      const result = await service.countDeletedProducts();

      expect(mockCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            softDeletedAt: expect.anything(),
          }),
        }),
      );
      expect(result).toBe(25);
    });
  });

  describe('getActiveProductsReport', () => {
    it('should return percentage of active products', async () => {
      const queryBuilder: any = mockCreateQueryBuilder();
      queryBuilder.getCount.mockResolvedValue(80);
      mockCount.mockResolvedValue(100);

      const result = await service.getActiveProductsReport({});

      expect(result).toEqual({ percentageNonDeleted: 80 });
    });

    it('should handle zero total products', async () => {
      const queryBuilder: any = mockCreateQueryBuilder();
      queryBuilder.getCount.mockResolvedValue(0);
      mockCount.mockResolvedValue(0);

      const result = await service.getActiveProductsReport({});

      expect(result).toEqual({ percentageNonDeleted: 0 });
    });
  });

  describe('getDeletedPercentageByCategoryInDateRange', () => {
    it('should return percentage of deleted products by category', async () => {
      mockCount.mockResolvedValueOnce(100);
      const queryBuilder = mockCreateQueryBuilder();
      queryBuilder.getCount.mockResolvedValueOnce(20);

      const result = await service.getDeletedPercentageByCategoryInDateRange({
        category: 'Electronics',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result).toEqual({ percentageDeleted: 20 });
    });

    it('should handle zero category products', async () => {
      mockCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await service.getDeletedPercentageByCategoryInDateRange({
        category: 'NonExistent',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(result).toEqual({ percentageDeleted: 0 });
    });
  });
});
