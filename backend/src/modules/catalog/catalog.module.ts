import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { TmdbClient } from './providers/tmdb.client';
import { TMDB_FETCH } from './providers/tmdb.transport';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    TmdbClient,
    { provide: TMDB_FETCH, useValue: fetch },
  ],
})
export class CatalogModule {}
