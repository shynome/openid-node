export function TrimSpace(s: string): string {
  return s.replace(/\s+/g, '')
}

export function isEmptyString(s: string): boolean {
  return typeof s !== 'string' || s.length === 0
}
