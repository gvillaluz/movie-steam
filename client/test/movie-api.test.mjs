import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import axios from 'axios';
import { loadMovies } from '../src/api/movieAPI.js';

const originalAdapter = axios.defaults.adapter;
afterEach(() => { axios.defaults.adapter = originalAdapter; });

describe('Movie API adapter', () => {
  it('requests only the backend catalog and returns its items without filtering', async () => {
    const items = [{ id: 550, title: 'Fight Club' }];
    const controller = new AbortController();
    const requests = [];
    axios.defaults.adapter = async config => {
      requests.push(config);
      return { data: { items }, status: 200, statusText: 'OK', headers: {}, config };
    };
    assert.deepEqual(await loadMovies({ signal: controller.signal }), items);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/catalog/movies/popular');
    assert.equal(requests[0].signal, controller.signal);
  });

  it('preserves a successful empty list', async () => {
    axios.defaults.adapter = async config => ({ data: { items: [] }, status: 200, statusText: 'OK', headers: {}, config });
    assert.deepEqual(await loadMovies(), []);
  });

  it('propagates a failed backend request instead of returning null', async () => {
    axios.defaults.adapter = async () => { throw new Error('Backend unavailable'); };
    await assert.rejects(loadMovies(), /Backend unavailable/);
  });

  it('rejects an invalid backend contract', async () => {
    axios.defaults.adapter = async config => ({ data: { items: null }, status: 200, statusText: 'OK', headers: {}, config });
    await assert.rejects(loadMovies(), /Invalid movie catalog response/);
  });

  it('honors request cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    axios.defaults.adapter = async config => ({ data: { items: [] }, status: 200, statusText: 'OK', headers: {}, config });
    await assert.rejects(loadMovies({ signal: controller.signal }), error => axios.isCancel(error));
  });
});
