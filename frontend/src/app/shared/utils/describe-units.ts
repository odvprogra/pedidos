export function describeUnits(units: number): string {
  return units === 1 ? '1 producto' : `${units} productos`;
}
