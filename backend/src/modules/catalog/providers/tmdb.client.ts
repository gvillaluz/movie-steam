import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogProviderError } from '../catalog-provider.error';
import { TMDB_FETCH } from './tmdb.transport';

@Injectable()
export class TmdbClient {
  constructor(
    private readonly config: ConfigService,
    @Inject(TMDB_FETCH) private readonly fetchProvider: typeof fetch,
  ) {}

  async getPopularMovies(page: number): Promise<unknown[]> {
    const key = this.config.get<string>('TMDB_API_KEY');
    if (!key) throw new CatalogProviderError('configuration');
    const url = new URL('https://api.themoviedb.org/3/movie/popular');
    url.searchParams.set('api_key', key);
    url.searchParams.set('page', String(page));
    try {
      const response = await this.fetchProvider(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new CatalogProviderError('upstream');
      const body: unknown = await response.json();
      if (
        typeof body !== 'object' ||
        body === null ||
        !('results' in body) ||
        !Array.isArray(body.results)
      ) {
        throw new CatalogProviderError('upstream');
      }
      return body.results;
    } catch (error) {
      if (error instanceof CatalogProviderError) throw error;
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new CatalogProviderError('timeout');
      }
      // Never propagate request URLs, provider payloads, or credentials into logs/responses.
      throw new CatalogProviderError('upstream');
    }
  }
}
