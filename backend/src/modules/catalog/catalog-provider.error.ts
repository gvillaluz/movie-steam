export class CatalogProviderError extends Error {
  constructor(public readonly kind: 'configuration' | 'upstream' | 'timeout') {
    super('Movie catalog provider unavailable.');
    this.name = 'CatalogProviderError';
  }
}
