import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    findProductsPaginated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call productsService.findProductsPaginated with pagination and filter DTOs', () => {
      const paginationDto = { page: 1, limit: 10 };
      const filterDto = { name: 'laptop', category: 'electronics' };
      const expectedResult = {
        data: [{ id: 1, name: 'Laptop', category: 'electronics' }],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockProductsService.findProductsPaginated.mockReturnValue(expectedResult);

      const result = controller.findAll(paginationDto, filterDto);

      expect(service.findProductsPaginated).toHaveBeenCalledWith(paginationDto, filterDto);
      expect(service.findProductsPaginated).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty pagination DTO', () => {
      const paginationDto = {};
      const filterDto = {};
      const expectedResult = { data: [], total: 0, page: 1, limit: 10 };

      mockProductsService.findProductsPaginated.mockReturnValue(expectedResult);

      const result = controller.findAll(paginationDto, filterDto);

      expect(service.findProductsPaginated).toHaveBeenCalledWith(paginationDto, filterDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle filter DTO with price range', () => {
      const paginationDto = { page: 2, limit: 5 };
      const filterDto = { minPrice: 100, maxPrice: 500 };
      const expectedResult = {
        data: [{ id: 2, name: 'Phone', price: 300 }],
        total: 1,
        page: 2,
        limit: 5,
      };

      mockProductsService.findProductsPaginated.mockReturnValue(expectedResult);

      const result = controller.findAll(paginationDto, filterDto);

      expect(service.findProductsPaginated).toHaveBeenCalledWith(paginationDto, filterDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle all filter parameters', () => {
      const paginationDto = { page: 1, limit: 20 };
      const filterDto = {
        name: 'gaming',
        category: 'electronics',
        minPrice: 200,
        maxPrice: 1000,
      };
      const expectedResult = {
        data: [{ id: 3, name: 'Gaming Laptop', category: 'electronics', price: 800 }],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockProductsService.findProductsPaginated.mockReturnValue(expectedResult);

      const result = controller.findAll(paginationDto, filterDto);

      expect(service.findProductsPaginated).toHaveBeenCalledWith(paginationDto, filterDto);
      expect(result).toEqual(expectedResult);
    });

    it('should return service result directly', () => {
      const paginationDto = { page: 1, limit: 10 };
      const filterDto = {};
      const serviceResult = { data: [], total: 0 };

      mockProductsService.findProductsPaginated.mockReturnValue(serviceResult);

      const result = controller.findAll(paginationDto, filterDto);

      expect(result).toBe(serviceResult);
    });
  });
});