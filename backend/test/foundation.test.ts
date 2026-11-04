import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ProbeController } from './fixtures/probe.controller';

describe('Foundation HTTP contract', () => {
  let app: INestApplication;
  let server: Server;

  before(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  after(async () => {
    await app?.close();
  });

  it('returns only the liveness status', async () => {
    await request(server)
      .get('/api/health')
      .expect('Content-Type', /application\/json/)
      .expect(200, { status: 'ok' });
  });

  it('returns consistent problem details for an unknown route', async () => {
    const response = await request(server)
      .get('/api/does-not-exist')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(404);
    assert.equal(response.body.status, 404);
    assert.equal(response.body.title, 'Not Found');
    assert.equal(response.body.instance, '/api/does-not-exist');
    assert.equal(typeof response.body.traceId, 'string');
    assert.ok(response.body.traceId.length > 0);
  });

  it('uses Nest routing semantics for unsupported methods', async () => {
    const response = await request(server)
      .post('/api/health')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(404);
    assert.equal(response.body.status, 404);
    assert.equal(response.body.instance, '/api/health');
  });

  it('does not expose unexpected exception messages or stack traces', async () => {
    const response = await request(server)
      .get('/api/test-probe/exception')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(500);
    assert.equal(response.body.status, 500);
    assert.equal(response.body.title, 'An unexpected error occurred.');
    assert.equal(response.body.instance, '/api/test-probe/exception');
    assert.equal(response.body.detail, undefined);
    assert.equal(response.body.stack, undefined);
    assert.ok(!response.text.includes('sensitive-test-message'));
  });

  it('accepts a valid DTO', async () => {
    await request(server)
      .post('/api/test-probe/validation')
      .send({ name: 'A movie room' })
      .expect(201, { name: 'A movie room' });
  });

  for (const body of [
    { name: 42 },
    { name: '' },
    {},
    { name: 'Room', admin: true },
  ]) {
    it(`rejects an invalid DTO: ${JSON.stringify(body)}`, async () => {
      const response = await request(server)
        .post('/api/test-probe/validation')
        .send(body)
        .expect('Content-Type', /application\/problem\+json/)
        .expect(400);
      assert.equal(response.body.status, 400);
      assert.equal(response.body.title, 'Bad Request');
      assert.ok(Array.isArray(response.body.errors));
      assert.ok(response.body.errors.length > 0);
    });
  }
});
