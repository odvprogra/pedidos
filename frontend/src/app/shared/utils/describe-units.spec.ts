import { describeUnits } from './describe-units';

describe('describeUnits', () => {
  it.each([
    [0, '0 productos'],
    [1, '1 producto'],
    [3, '3 productos'],
  ])('describes %d units as "%s"', (units, text) => {
    expect(describeUnits(units)).toBe(text);
  });
});
