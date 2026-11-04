import { Injectable } from '@nestjs/common';
import type { MovieCatalogDto, MovieDto } from './dto/movie.dto';
import { TmdbClient } from './providers/tmdb.client';

@Injectable()
export class CatalogService {
  constructor(private readonly tmdb: TmdbClient) {}

  async getPopularMovies(): Promise<MovieCatalogDto> {
    const unique = new Map<number, Record<string, unknown>>();
    for (let page = 1; page <= 5; page++) {
      for (const candidate of await this.tmdb.getPopularMovies(page)) {
        if (
          typeof candidate !== 'object' ||
          candidate === null ||
          !('id' in candidate)
        )
          continue;
        const item = candidate as Record<string, unknown>;
        if (
          typeof item.id === 'number' &&
          Number.isSafeInteger(item.id) &&
          item.id > 0
        )
          unique.set(item.id, item);
      }
    }

    const items: MovieDto[] = [];
    for (const item of unique.values()) {
      if (
        typeof item.title !== 'string' ||
        !item.title.trim() ||
        typeof item.poster_path !== 'string' ||
        !item.poster_path.trim() ||
        typeof item.release_date !== 'string' ||
        !item.release_date.trim()
      )
        continue;
      const movie: MovieDto = {
        id: item.id as number,
        title: item.title,
        poster_path: item.poster_path,
        release_date: item.release_date,
      };
      for (const field of [
        'overview',
        'original_title',
        'original_language',
      ] as const) {
        if (typeof item[field] === 'string') movie[field] = item[field];
      }
      for (const field of ['vote_average', 'vote_count'] as const) {
        if (typeof item[field] === 'number' && Number.isFinite(item[field]))
          movie[field] = item[field];
      }
      if (typeof item.backdrop_path === 'string' || item.backdrop_path === null)
        movie.backdrop_path = item.backdrop_path;
      items.push(movie);
    }
    return { items };
  }
}
