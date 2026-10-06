const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createRouter, validate } = require('../routes/apariencia');
const theme = () => ({ name: 'Navidad', kicker: 'Temporada', title: 'TiendaPro en Navidad', description: 'Regalos', button: 'Explorar', announcement: 'Navidad', catalogTitle: 'Regalos', accent: '#b52636', buttonText: '#ffffff', background: '#ffffff', heroBackground: '#123e2c', heroText: '#ffffff', radius: 8, heroHeight: 330, fontSize: 43, imagePosition: 50, align: 'center', heroImage: '', logo: '', order: ['hero', 'benefits', 'catalog', 'related'] });

test('appearance rejects invalid configuration and never stores product fields', () => {
  assert.throws(() => validate({ ...theme(), accent: 'red;display:none' }));
  assert.throws(() => validate({ ...theme(), logo: '/uploads/branding/../../secret.png' }));
  assert.throws(() => validate({ ...theme(), order: ['hero', 'hero', 'catalog', 'related'] }));
  assert.throws(() => validate({ ...theme(), heroHeight: 1 }));
  assert.throws(() => validate({ ...theme(), title: 'x'.repeat(181) }));
  assert.equal(validate({ ...theme(), price: 1, product: { name: 'changed' }, script: 'alert(1)' }).price, undefined);
});

test('draft isolation, admin permissions, upload, publishing and reversible restoration', async t => {
  const previousSecret = process.env.JWT_SECRET; process.env.JWT_SECRET = 'appearance-isolated-test';
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tiendapro-appearance-'));
  const options = { dataDir: path.join(directory, 'data'), uploadDir: path.join(directory, 'uploads') };
  const app = express(); app.use('/theme', createRouter(options));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(directory, { recursive: true, force: true }); if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret; });
  const api = `http://127.0.0.1:${server.address().port}/theme`;
  const headers = claims => ({ Authorization: 'Bearer ' + jwt.sign(claims, process.env.JWT_SECRET), 'Content-Type': 'application/json' });
  const admin = headers({ id: 1, rol: 'admin', portal: 'panel' });
  const post = (action, body = theme(), h = admin) => fetch(api + '/' + action, { method: 'POST', headers: h, body: JSON.stringify(body) });
  const published = async () => (await (await fetch(api + '/publicada')).json()).theme;
  assert.equal(await published(), null);
  assert.equal((await fetch(api)).status, 401);
  for (const action of ['borrador', 'publicar', 'restaurar', 'anterior', 'imagen']) {
    assert.equal((await post(action, theme(), {})).status, 401);
    for (const claim of [{ rol: 'cliente', portal: 'tienda' }, { rol: 'empleado', portal: 'panel' }, { rol: 'admin', portal: 'tienda' }]) assert.equal((await post(action, theme(), headers(claim))).status, 403);
  }
  assert.equal((await post('publicar', { ...theme(), heroImage: '/uploads/branding/missing.png' })).status, 400);
  const form = new FormData(); form.append('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'banner.png');
  const uploaded = await fetch(api + '/imagen', { method: 'POST', headers: { Authorization: admin.Authorization }, body: form });
  assert.equal(uploaded.status, 200); const image = (await uploaded.json()).url;
  const draft = { ...theme(), heroImage: image };
  assert.equal((await post('borrador', draft)).status, 200); assert.equal(await published(), null);
  assert.deepEqual((await (await fetch(api, { headers: admin })).json()).draft, validate(draft));
  assert.equal((await post('publicar', draft)).status, 200); assert.deepEqual(await published(), validate(draft));
  assert.equal((await post('publicar', { ...draft, name: 'Otra campaña' })).status, 200);
  await post('anterior', {}); assert.equal((await published()).name, 'Navidad');
  await post('restaurar', {}); assert.equal(await published(), null);
  await post('anterior', {}); assert.equal((await published()).name, 'Navidad');
  assert.equal(JSON.parse(await fs.readFile(path.join(options.dataDir, 'appearance.json'), 'utf8')).published.name, 'Navidad');
});
