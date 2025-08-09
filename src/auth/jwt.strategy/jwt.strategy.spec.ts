import { JwtStrategy } from './jwt.strategy';

class MockConfigService {
  get = jest.fn();
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = new MockConfigService();

  describe('constructor', () => {
    it('should create strategy with valid JWT_SECRET', () => {
      mockConfigService.get.mockReturnValue('test-secret-key');

      expect(() => {
        strategy = new JwtStrategy(mockConfigService as any);
      }).not.toThrow();

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should throw error when JWT_SECRET is not defined', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => {
        new JwtStrategy(mockConfigService as any);
      }).toThrow('JWT_SECRET must be defined in the environment variables.');
    });

    it('should throw error when JWT_SECRET is empty string', () => {
      mockConfigService.get.mockReturnValue('');

      expect(() => {
        new JwtStrategy(mockConfigService as any);
      }).toThrow('JWT_SECRET must be defined in the environment variables.');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-secret-key');
      strategy = new JwtStrategy(mockConfigService as any);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return user object with userId and username', () => {
      const payload = {
        sub: 'user123',
        username: 'testuser',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };

      const result = strategy.validate(payload as any);

      expect(result).toEqual({
        userId: 'user123',
        username: 'testuser',
      });
    });

    it('should handle payload with additional fields', () => {
      const payload = {
        sub: 'user456',
        username: 'anotheruser',
        email: 'test@example.com',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };

      const result = strategy.validate(payload as any);

      expect(result).toEqual({
        userId: 'user456',
        username: 'anotheruser',
      });
    });

    it('should handle payload with missing optional fields', () => {
      const payload = {
        sub: 'user789',
        username: 'minimaluser',
      };

      const result = strategy.validate(payload as any);

      expect(result).toEqual({
        userId: 'user789',
        username: 'minimaluser',
      });
    });
  });
});
