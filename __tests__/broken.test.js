const { willAlwaysFail } = require('../src/brokenFeature');

describe('brokenFeature', () => {
  test('should return true for truthy values', () => {
    expect(willAlwaysFail(1)).toBe(true);
    expect(willAlwaysFail('x')).toBe(true);
  });
});
