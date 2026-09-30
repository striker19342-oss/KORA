export function circuitIdFromKeyLocation(keyLocation: string): string {
  const separator = keyLocation.lastIndexOf('#');
  return separator < 0 ? keyLocation : keyLocation.slice(separator + 1);
}
