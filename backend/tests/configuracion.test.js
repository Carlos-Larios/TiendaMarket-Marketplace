const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createRouter } = require('../routes/configuracion');

test('global logo permissions, validation, persistence and reset', async t => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'branding-test-secret';
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tiendapro-branding-test-'));
  const options = { dataDir: path.join(directory, 'data'), uploadDir: path.join(directory, 'uploads') };
  const app = express();
  app.use('/api/configuracion', createRouter(options));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const api = `http://127.0.0.1:${server.address().port}/api/configuracion/marca`;
  const headers = claims => ({ Authorization: `Bearer ${jwt.sign(claims, process.env.JWT_SECRET)}` });
  const admin = headers({ id: 1, rol: 'admin', portal: 'panel' });
  const initial = await fetch(api);
  assert.equal(initial.status, 200);
  assert.equal((await initial.json()).logo_url, '');
  assert.equal((await fetch(api + '/logo', { method: 'DELETE' })).status, 401);
  for (const claims of [{ rol: 'cliente', portal: 'tienda' }, { rol: 'empleado', portal: 'panel' }, { rol: 'admin', portal: 'tienda' }]) {
    assert.equal((await fetch(api + '/logo', { method: 'DELETE', headers: headers(claims) })).status, 403);
    assert.equal((await fetch(api + '/logo', { method: 'POST', headers: headers(claims) })).status, 403);
  }
  const invalid = new FormData();
  invalid.append('logo', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');
  assert.equal((await fetch(api + '/logo', { method: 'POST', headers: admin, body: invalid })).status, 400);
  const oversize = new FormData();
  oversize.append('logo', new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'large.png');
  assert.equal((await fetch(api + '/logo', { method: 'POST', headers: admin, body: oversize })).status, 400);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
  const body = new FormData();
  body.append('logo', new Blob([png], { type: 'image/png' }), 'logo.png');
  const saved = await fetch(api + '/logo', { method: 'POST', headers: admin, body });
  assert.equal(saved.status, 200);
  const config = await saved.json();
  assert.match(config.logo_url, /^\/uploads\/branding\/[a-f0-9-]+\.png$/);
  assert.deepEqual(await fs.readFile(path.join(options.uploadDir, path.basename(config.logo_url))), png);
  assert.equal((await (await fetch(api)).json()).logo_url, config.logo_url);
  const secondApp = express();
  secondApp.use('/api/configuracion', createRouter(options));
  const secondServer = secondApp.listen(0, '127.0.0.1');
  await new Promise(resolve => secondServer.once('listening', resolve));
  try {
    const reread = await fetch(`http://127.0.0.1:${secondServer.address().port}/api/configuracion/marca`);
    assert.equal((await reread.json()).logo_url, config.logo_url);
  } finally { await new Promise(resolve => secondServer.close(resolve)); }
  const restored = await fetch(api + '/logo', { method: 'DELETE', headers: admin });
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).logo_url, '');
  assert.equal((await (await fetch(api)).json()).logo_url, '');
});
