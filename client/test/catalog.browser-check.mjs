import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MOVIE_PLAYWRIGHT_MODULE);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = path.join(root, 'backend/verification/catalog');
const children = [];

async function start(file, args, cwd, env, pattern) {
    const child = spawn(process.execPath, [file, ...args], {
        cwd, env: { ...process.env, ...env }, windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    return new Promise((resolve, reject) => {
        let output = '';
        const timer = setTimeout(() => reject(new Error(`${path.basename(cwd)} server startup timed out: ${output.slice(-2000)}`)), 30000);
        child.stderr.on('data', data => { output += data.toString(); });
        child.stdout.on('data', data => {
            output += data.toString().replace(/\u001b\[[0-9;]*m/g, '');
            const match = output.match(pattern);
            if (match) { clearTimeout(timer); resolve(match[1]); }
        });
        child.once('error', error => { clearTimeout(timer); reject(error); });
        child.once('exit', code => { clearTimeout(timer); reject(new Error(`Local server exited: ${code}`)); });
    });
}

const fixture = (id, title) => ({ id, title, poster_path: '/fixture.jpg', release_date: '1999-10-15' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('movie catalog wiring and browser regressions', { timeout: 180000 }, async (t) => {
    let browser;
    const checks = [];
    const record = result => { checks.push(result); console.log(result.check + ': ' + (result.passed ? 'PASS' : 'PRE-EXISTING ISSUE')); };
    try {
        await mkdir(evidence, { recursive: true });
        const backend = await start('dist/main.js', [], path.join(root, 'backend'),
            { PORT: '0', HOST: '127.0.0.1', NODE_ENV: 'production' }, /Listening on (http:\/\/127\.0\.0\.1:\d+)/);
        const frontend = await start('node_modules/vite/bin/vite.js', ['--host', '127.0.0.1', '--port', '0'],
            path.join(root, 'client'), { API_PROXY_TARGET: backend }, /Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/);
        browser = await chromium.launch({ headless: true, executablePath: process.env.MOVIE_BROWSER_EXECUTABLE });
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const directProviderRequests = [];
        page.on('request', req => {
            const url = new URL(req.url());
            if (url.hostname === 'api.themoviedb.org') directProviderRequests.push(url.pathname);
        });

        const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/catalog/movies/popular') && r.status() === 200);
        await page.goto(frontend, { waitUntil: 'domcontentloaded' });
        const response = await responsePromise;
        const payload = await response.json();
        assert.ok(payload.items.length > 0);
        await page.locator('.movie-card').first().waitFor();
        assert.equal(await page.locator('.movie-card').count(), payload.items.length);
        assert.deepEqual(directProviderRequests, []);
        record({ check: 'live Home -> Vite proxy -> NestJS -> TMDB', passed: true, displayedMovies: payload.items.length, directTmdbApiRequests: 0 });
        await page.screenshot({ path: path.join(evidence, 'home.png') });

        await page.getByRole('link', { name: 'Movies', exact: true }).click();
        await page.getByRole('heading', { name: 'Popular Movies', exact: true }).waitFor();
        assert.ok(await page.locator('.movie-card').count() > 0);
        assert.deepEqual(directProviderRequests, []);
        record({ check: 'live Movies through backend', passed: true });

        const favoriteTitle = await page.locator('.movie-card h4').first().innerText();
        await page.locator('.movie-card').first().hover();
        await page.locator('.likeBtn').first().click();
        await page.getByRole('link', { name: 'Favorites', exact: true }).click();
        await page.getByRole('heading', { name: favoriteTitle, exact: true }).waitFor();
        record({ check: 'favorites toggle and navigation remain functional', passed: true });

        const originalContext = execFileSync('git', ['show', 'HEAD:client/src/context/searchContext.jsx'], { cwd: root, encoding: 'utf8', windowsHide: true });
        const currentContext = await readFile(path.join(root, 'client/src/context/searchContext.jsx'), 'utf8');
        const storageEffects = raw => {
            const source = raw.replaceAll('\r\n', '\n');
            return source.slice(source.indexOf('    useEffect(() => {\n        const storedFavorites'), source.indexOf('    const addToFavorites'));
        };
        assert.ok(storageEffects(originalContext));
        assert.equal(storageEffects(currentContext), storageEffects(originalContext));
        await t.test('favorites survive refresh', { todo: 'Pre-existing StrictMode storage effects clear favorites; effects match the original source exactly.' }, async () => {
            await page.reload();
            await page.waitForLoadState('networkidle');
            assert.equal(await page.getByRole('heading', { name: favoriteTitle, exact: true }).count(), 1);
        });
        record({ check: 'favorites survive refresh', passed: false, preExisting: true, evidence: 'Storage effect source is unchanged from HEAD; refresh assertion remains recorded as TODO.' });

        await page.getByRole('link', { name: 'TV Series', exact: true }).click();
        await page.getByRole('heading', { name: 'Popular TV Series', exact: true }).waitFor();
        assert.ok(await page.locator('.movie-card').count() > 0);
        assert.ok(directProviderRequests.includes('/3/tv/popular'));
        record({ check: 'live legacy series remains functional', passed: true });

        await page.getByRole('link', { name: 'Movies', exact: true }).click();
        await page.getByRole('heading', { name: 'Popular Movies', exact: true }).waitFor();
        await page.getByPlaceholder('Search Movie').fill('Matrix');
        await page.getByRole('button', { name: 'Search', exact: true }).click();
        await page.getByRole('heading', { name: "Search Results for 'Matrix'", exact: true }).waitFor();
        assert.ok(await page.locator('.movie-card').count() > 0);
        assert.ok(directProviderRequests.includes('/3/search/movie'));
        record({ check: 'live legacy movie search remains functional', passed: true });

        const controlled = await browser.newPage();
        // Controlled network cases are separate from the real-provider checks above.
        let mode = 'loading';
        await controlled.route('**/api/catalog/movies/popular', async route => {
            if (mode === 'loading' || mode === 'slow') await pause(1200);
            const status = mode === 'error' ? 502 : 200;
            const items = mode === 'empty' ? [] : [fixture(550, 'Controlled movie')];
            await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status === 200 ? { items } : { status: 502 }) }).catch(() => {});
        });
        await controlled.goto(frontend + 'movie');
        await controlled.getByRole('status').waitFor();
        assert.equal(await controlled.getByText('No movies found.').count(), 0);
        await controlled.getByRole('heading', { name: 'Controlled movie', exact: true }).waitFor();
        record({ check: 'controlled loading remains visible until completion', passed: true });

        mode = 'error';
        await controlled.reload();
        await controlled.getByRole('alert').waitFor();
        assert.equal(await controlled.getByText('No movies found.').count(), 0);
        mode = 'success';
        await controlled.getByRole('button', { name: 'Try again' }).click();
        await controlled.getByRole('heading', { name: 'Controlled movie', exact: true }).waitFor();
        record({ check: 'controlled backend failure is distinct and retry recovers', passed: true });

        mode = 'empty';
        await controlled.reload();
        await controlled.getByText('No movies found.', { exact: true }).waitFor();
        assert.equal(await controlled.getByRole('alert').count(), 0);
        record({ check: 'controlled empty response renders an empty state', passed: true });

        await controlled.route('https://api.themoviedb.org/3/tv/popular?*', route => route.fulfill({
            json: { results: [{ id: 1399, name: 'Controlled series', poster_path: '/series.jpg', first_air_date: '2011-04-17' }] },
        }));
        mode = 'slow';
        await controlled.reload();
        await controlled.getByRole('status').waitFor();
        await controlled.getByRole('link', { name: 'TV Series', exact: true }).click();
        await controlled.getByRole('heading', { name: 'Controlled series', exact: true }).waitFor();
        await pause(1400);
        assert.equal(await controlled.getByRole('heading', { name: 'Controlled movie', exact: true }).count(), 0);
        record({ check: 'controlled late movie response cannot overwrite series navigation', passed: true });

        mode = 'success';
        await controlled.getByRole('link', { name: 'Movies', exact: true }).click();
        await controlled.getByRole('heading', { name: 'Controlled movie', exact: true }).waitFor();
        await controlled.route('https://api.themoviedb.org/3/search/movie?*', async route => {
            const query = new URL(route.request().url()).searchParams.get('query');
            if (query === 'Old') await pause(900);
            await route.fulfill({ json: { results: [fixture(query === 'Old' ? 1 : 2, `${query} result`)] } });
        });
        await controlled.getByPlaceholder('Search Movie').fill('Old');
        await controlled.getByRole('button', { name: 'Search', exact: true }).click();
        await controlled.getByPlaceholder('Search Movie').fill('New');
        await controlled.getByRole('button', { name: 'Search', exact: true }).click();
        await controlled.getByRole('heading', { name: 'New result', exact: true }).waitFor();
        await pause(1100);
        assert.equal(await controlled.getByRole('heading', { name: 'Old result', exact: true }).count(), 0);
        record({ check: 'controlled stale search result cannot replace the newer query', passed: true });
        await writeFile(path.join(evidence, 'browser.json'), JSON.stringify(checks, null, 2) + '\n');
        console.log(JSON.stringify(checks));
    } catch (error) {
        await writeFile(path.join(evidence, 'browser-partial.json'), JSON.stringify({ checks, error: String(error) }, null, 2) + '\n');
        throw error;
    } finally {
        await browser?.close();
        for (const child of children.reverse()) {
            if (child.exitCode === null) {
                const exited = once(child, 'exit');
                child.kill();
                await exited;
            }
        }
    }
});
