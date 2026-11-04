export interface MovieDto {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  original_title?: string;
  original_language?: string;
  backdrop_path?: string | null;
}

export interface MovieCatalogDto {
  items: MovieDto[];
}
