import {
  BadGatewayException,
  Controller,
  GatewayTimeoutException,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogProviderError } from './catalog-provider.error';
import type { MovieCatalogDto } from './dto/movie.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('movies/popular')
  async getPopularMovies(): Promise<MovieCatalogDto> {
    try {
      return await this.catalog.getPopularMovies();
    } catch (error) {
      if (!(error instanceof CatalogProviderError)) throw error;
      if (error.kind === 'configuration')
        throw new ServiceUnavailableException();
      if (error.kind === 'timeout') throw new GatewayTimeoutException();
      throw new BadGatewayException();
    }
  }
}
