export function map<T extends any[], U>(
  collection: T,
  map: (value: T[number], key: number, collection: T) => U
): U[];

export function map<T extends Record<string, any>, U>(
  collection: T,
  map: (value: T[keyof T], key: keyof T, collection: T) => U
): Record<keyof T, U>;

/**
 * Map arrays and objects alike.
 *
 * TypeScript can't determine types inside the function, hence the any signature. The overload types take care of caller safety, at least.
 *
 * @see https://github.com/microsoft/TypeScript/issues/21879
 * @see https://github.com/microsoft/TypeScript/issues/30581
 */
export function map(collection: any, map: any) {
  if (Array.isArray(collection)) {
    return collection.map(map);
  }
  return Object.fromEntries(
    Object.keys(collection).map((key) => [
      key,
      map(collection[key], key, collection),
    ])
  );
}
