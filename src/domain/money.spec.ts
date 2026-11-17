import { multiplyAmount, splitByRate } from './money.js';

describe('money', () => {
  describe('multiplyAmount', () => {
    it('multiplies in cents without floating point errors', () => {
      expect(multiplyAmount(33.33, 3)).toBe(99.99);
      expect(multiplyAmount(0.1, 3)).toBe(0.3);
    });

    it('rejects a non integer multiplier', () => {
      expect(() => multiplyAmount(10, 1.5)).toThrow();
      expect(() => multiplyAmount(10, 0)).toThrow();
    });
  });

  describe('splitByRate', () => {
    it('splits 10% so both parts add up to the amount', () => {
      expect(splitByRate(500, 0.1)).toEqual({ part: 50, rest: 450 });
      expect(splitByRate(1234.55, 0.1)).toEqual({ part: 123.46, rest: 1111.09 });
    });

    it('gives a zero part when it rounds below one cent', () => {
      expect(splitByRate(0.01, 0.1)).toEqual({ part: 0, rest: 0.01 });
    });
  });
});
