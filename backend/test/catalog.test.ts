import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { TMDB_FETCH } from '../src/modules/catalog/providers/tmdb.transport';

const movie = (id: number, title: string) => ({
  id,
  title,
  poster_path: `/poster-${id}.jpg`,
  release_date: '1999-10-15',
  overview: 'A realistic catalog fixture.',
  vote_average: 8.4,
});
const pages: unknown[][] = [
  [
    movie(550, 'Fight Club'),
    movie(603, 'The Matrix'),
    { ...movie(99, 'No poster'), poster_path: null },
  ],
  [
    movie(550, 'Fight Club updated'),
    movie(680, 'Pulp Fiction'),
    { ...movie(98, 'No date'), release_date: '' },
  ],
  [{ ...movie(97, 'No title'), title: '' }, movie(13, 'Forrest Gump')],
  [null, 'invalid', { id: 96 }],
  [],
];

describe('Popular movie catalog through the real controller and service', () => {
  let app: INestApplication;
  let provider: Server;
  let origin: string;
  let mode = 'normal';
  let requestedPages: number[] = [];
  let originalApiKey: string | undefined;

  const transport: typeof fetch = async (input, options) => {
    if (mode === 'timeout')
      throw new DOMException('Provider timeout', 'TimeoutError');
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://api.themoviedb.org');
    assert.equal(url.pathname, '/3/movie/popular');
    assert.equal(url.searchParams.get('api_key'), 'fixture-key');
    return fetch(origin + url.pathname + url.search, options);
  };

  before(async () => {
    originalApiKey = process.env.TMDB_API_KEY;
    process.env.TMDB_API_KEY = 'synthetic-environment-key';
    provider = createServer((req, res) => {
      const url = new URL(req.url!, 'http://localhost');
      const page = Number(url.searchParams.get('page'));
      requestedPages.push(page);
      res.setHeader('Content-Type', 'application/json');
      if (mode === 'upstream' && page === 2) {
        res
          .writeHead(429)
          .end(JSON.stringify({ message: 'private-provider-detail' }));
        return;
      }
      res.end(
        JSON.stringify({
          results:
            mode === 'empty'
              ? []
              : mode === 'invalid' && page === 2
                ? 'broken'
                : pages[page - 1],
        }),
      );
    });
    await new Promise<void>((resolve) =>
      provider.listen(0, '127.0.0.1', resolve),
    );
    const address = provider.address();
    assert.ok(address && typeof address !== 'string');
    origin = `http://127.0.0.1:${address.port}`;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          key === 'TMDB_API_KEY' ? 'fixture-key' : undefined,
      })
      .overrideProvider(TMDB_FETCH)
      .useValue(transport)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    mode = 'normal';
    requestedPages = [];
  });
  after(async () => {
    if (originalApiKey === undefined) delete process.env.TMDB_API_KEY;
    else process.env.TMDB_API_KEY = originalApiKey;
    await app?.close();
    provider?.closeAllConnections();
    await new Promise<void>((resolve) => provider.close(() => resolve()));
  });

  it('aggregates five pages, keeps first position and last duplicate value, and filters incomplete entries', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/catalog/movies/popular')
      .expect(200);
    assert.deepEqual(requestedPages, [1, 2, 3, 4, 5]);
    assert.deepEqual(
      response.body.items.map((item: { id: number }) => item.id),
      [550, 603, 680, 13],
    );
    assert.equal(response.body.items[0].title, 'Fight Club updated');
    assert.equal(response.body.items[0].poster_path, '/poster-550.jpg');
    assert.equal(response.body.items[0].release_date, '1999-10-15');
    assert.ok(!response.text.includes('fixture-key'));
  });

  it('represents a genuinely empty catalog as a successful empty list', async () => {
    mode = 'empty';
    await request(app.getHttpServer())
      .get('/api/catalog/movies/popular')
      .expect(200, { items: [] });
  });

  for (const failure of ['upstream', 'invalid']) {
    it(`rejects a ${failure} page without returning a partial list`, async () => {
      mode = failure;
      const response = await request(app.getHttpServer())
        .get('/api/catalog/movies/popular')
        .expect(502);
      assert.equal(response.body.title, 'Bad Gateway');
      assert.equal(response.body.items, undefined);
      assert.ok(!response.text.includes('fixture-key'));
      assert.ok(!response.text.includes('private-provider-detail'));
      assert.deepEqual(requestedPages, [1, 2]);
    });
  }

  it('reports an upstream timeout distinctly', async () => {
    mode = 'timeout';
    await request(app.getHttpServer())
      .get('/api/catalog/movies/popular')
      .expect(504);
  });

  it('reports missing fixture credentials without a provider call even when an environment key exists', async () => {
    let providerCalls = 0;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue({ get: () => undefined })
      .overrideProvider(TMDB_FETCH)
      .useValue(async () => {
        providerCalls++;
        throw new Error('Unexpected provider call');
      })
      .compile();
    const unconfiguredApp = module.createNestApplication({ logger: false });
    configureApp(unconfiguredApp);
    await unconfiguredApp.init();
    try {
      await request(unconfiguredApp.getHttpServer())
        .get('/api/catalog/movies/popular')
        .expect(503);
      assert.deepEqual(requestedPages, []);
      assert.equal(providerCalls, 0);
    } finally {
      await unconfiguredApp.close();
    }
  });
});
