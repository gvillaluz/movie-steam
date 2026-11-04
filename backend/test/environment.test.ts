import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEnvironment } from '../src/config/environment';

describe('Startup configuration', () => {
  it('defaults to a local development server', () => {
    assert.deepEqual(validateEnvironment({}), {
      HOST: '127.0.0.1',
      PORT: 5080,
      NODE_ENV: 'development',
    });
  });

  it('accepts explicit valid configuration', () => {
    assert.deepEqual(
      validateEnvironment({
        PORT: '5081',
        HOST: 'localhost',
        NODE_ENV: 'production',
      }),
      { PORT: 5081, HOST: 'localhost', NODE_ENV: 'production' },
    );
  });

  it('permits an OS-assigned port for isolated verification', () => {
    assert.equal(validateEnvironment({ PORT: '0' }).PORT, 0);
  });

  for (const PORT of ['-1', '65536', 'abc', '5080junk', '', '3.5']) {
    it(`rejects invalid port ${JSON.stringify(PORT)}`, () => {
      assert.throws(() => validateEnvironment({ PORT }), /PORT/);
    });
  }

  it('rejects an empty host', () => {
    assert.throws(() => validateEnvironment({ HOST: ' ' }), /HOST/);
  });

  it('rejects unsupported environments', () => {
    assert.throws(
      () => validateEnvironment({ NODE_ENV: 'staging' }),
      /NODE_ENV/,
    );
  });
});
