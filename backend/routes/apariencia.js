const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

const blocks = ['hero', 'benefits', 'catalog', 'related'];
function validate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuración inválida.');
  const result = { version: 1 };
  if (value.original !== undefined && typeof value.original !== 'boolean') throw new Error('Diseño inválido.');
  result.original = value.original === true;
  const text = ['name', 'kicker', 'title', 'description', 'button', 'announcement', 'catalogTitle'];
  for (const key of text) {
    if (typeof value[key] !== 'string' || value[key].length > (key === 'description' ? 500 : 180)) throw new Error('Texto inválido: ' + key);
    result[key] = value[key].trim();
  }
  for (const key of ['accent', 'buttonText', 'background', 'heroBackground', 'heroText']) {
    if (!/^#[\da-f]{6}$/i.test(value[key] || '')) throw new Error('Color inválido: ' + key);
    result[key] = value[key];
  }
  for (const [key, min, max] of [['radius', 0, 40], ['heroHeight', 200, 600], ['fontSize', 18, 56], ['imagePosition', 0, 100]]) {
    if (!Number.isFinite(value[key]) || value[key] < min || value[key] > max) throw new Error('Tamaño inválido: ' + key);
    result[key] = value[key];
  }
  if (!['left', 'center', 'right'].includes(value.align)) throw new Error('Alineación inválida.');
  result.align = value.align;
  for (const key of ['heroImage', 'logo']) {
    if (typeof value[key] !== 'string' || (value[key] && !/^\/uploads\/branding\/[a-f0-9-]+\.(png|jpg|webp)$/.test(value[key]))) throw new Error('Imagen inválida.');
    result[key] = value[key];
  }
  if (!Array.isArray(value.order) || value.order.length !== blocks.length || new Set(value.order).size !== blocks.length || value.order.some(key => !blocks.includes(key))) throw new Error('Orden inválido.');
  result.order = [...value.order];
  return result;
}

function createRouter(options = {}) {
  const router = express.Router();
  const dataDir = options.dataDir || path.resolve(__dirname, '../data');
  const uploadDir = options.uploadDir || path.resolve(__dirname, '../uploads/branding');
  const file = path.join(dataDir, 'appearance.json');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('image');
  let queue = Promise.resolve();
  async function read() {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return { draft: null, published: null, previous: null }; throw error; }
  }
  function change(update) {
    const operation = queue.then(async () => {
      const config = await read();
      await update(config);
      config.updated_at = new Date().toISOString();
      await fs.mkdir(dataDir, { recursive: true });
      const temp = path.join(dataDir, `appearance-${randomUUID()}.tmp`);
      try { await fs.writeFile(temp, JSON.stringify(config), { flag: 'wx' }); await fs.rename(temp, file); }
      finally { await fs.unlink(temp).catch(() => {}); }
      return config;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  router.get('/publicada', async (req, res) => {
    try { const config = await read(); res.set('Cache-Control', 'no-store').json({ theme: config.published, updated_at: config.updated_at }); }
    catch (_) { res.status(500).json({ mensaje: 'No se pudo cargar la apariencia.' }); }
  });
  router.use(verificarToken, soloAdmin);
  router.use(express.json({ limit: '32kb' }));
  router.get('/', async (req, res) => {
    try { res.set('Cache-Control', 'no-store').json(await read()); }
    catch (_) { res.status(500).json({ mensaje: 'No se pudo cargar el borrador.' }); }
  });
  for (const action of ['borrador', 'publicar', 'restaurar', 'anterior']) {
    router.post('/' + action, async (req, res) => {
      let theme;
      if (['borrador', 'publicar'].includes(action)) {
        try { theme = validate(req.body); }
        catch (error) { return res.status(400).json({ mensaje: error.message }); }
        for (const key of ['heroImage', 'logo']) if (theme[key]) {
          try { await fs.access(path.join(uploadDir, path.basename(theme[key]))); }
          catch (_) { return res.status(400).json({ mensaje: 'La imagen seleccionada no existe.' }); }
        }
      }
      try {
        const config = await change(config => {
          if (action === 'borrador') config.draft = theme;
          if (action === 'publicar') { config.previous = config.published; config.published = theme; config.draft = theme; }
          if (action === 'restaurar') { config.previous = config.published; config.published = null; }
          if (action === 'anterior') { const current = config.published; config.published = config.previous; config.previous = current; }
        });
        res.json({ ...config, mensaje: action === 'borrador' ? 'Borrador guardado. El inicio no ha cambiado.' : 'Apariencia publicada en el inicio.' });
      } catch (_) { res.status(500).json({ mensaje: 'No se pudo guardar la apariencia.' }); }
    });
  }
  router.post('/imagen', (req, res) => upload(req, res, async error => {
    if (error) return res.status(400).json({ mensaje: 'Selecciona una imagen de hasta 5 MB.' });
    const buffer = req.file?.buffer;
    const ext = buffer?.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? '.png' : buffer?.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 ? '.jpg' : buffer?.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' ? '.webp' : null;
    if (!ext) return res.status(400).json({ mensaje: 'Selecciona PNG, JPG o WebP.' });
    try {
      await fs.mkdir(uploadDir, { recursive: true }); const filename = randomUUID() + ext;
      await fs.writeFile(path.join(uploadDir, filename), buffer, { flag: 'wx' });
      res.json({ url: '/uploads/branding/' + filename });
    } catch (_) { res.status(500).json({ mensaje: 'No se pudo guardar la imagen.' }); }
  }));
  return router;
}
module.exports = { createRouter, validate };
