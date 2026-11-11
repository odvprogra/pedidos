const ID = /^[1-9]\d{0,14}$/;

export function parseId(text: string): number | null {
  return ID.test(text) ? Number(text) : null;
}
