const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

function createRouter(options = {}) {
  const router = express.Router();
  router.use('/apariencia', require('./apariencia').createRouter(options));
  const dataDir = options.dataDir || path.resolve(__dirname, '../data');
  const uploadDir = options.uploadDir || path.resolve(__dirname, '../uploads/branding');
  const configPath = path.join(dataDir, 'branding.json');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('logo');

  async function read() {
    try { return JSON.parse(await fs.readFile(configPath, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return { logo_url: '', updated_at: null }; throw error; }
  }
  async function save(config) {
    await fs.mkdir(dataDir, { recursive: true });
    const temp = path.join(dataDir, `branding-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temp, JSON.stringify(config), { flag: 'wx' });
      await fs.rename(temp, configPath);
    } finally { await fs.unlink(temp).catch(() => {}); }
    return config;
  }
  function extension(buffer) {
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
    if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return '.jpg';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
    return null;
  }

  router.get('/marca', async (req, res) => {
    try { res.set('Cache-Control', 'no-store').json(await read()); }
    catch (_) { res.status(500).json({ mensaje: 'No se pudo cargar el logo de TiendaPro.' }); }
  });
  router.post('/marca/logo', verificarToken, soloAdmin, (req, res) => {
    upload(req, res, async error => {
      if (error) return res.status(400).json({ mensaje: error.code === 'LIMIT_FILE_SIZE' ? 'El logo debe pesar como máximo 5 MB.' : 'No se pudo recibir la imagen.' });
      const ext = req.file && extension(req.file.buffer);
      if (!ext) return res.status(400).json({ mensaje: 'Selecciona una imagen PNG, JPG o WebP.' });
      let filename;
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        filename = `${randomUUID()}${ext}`;
        await fs.writeFile(path.join(uploadDir, filename), req.file.buffer, { flag: 'wx' });
        const config = await save({ logo_url: `/uploads/branding/${filename}`, updated_at: new Date().toISOString() });
        res.json({ ...config, mensaje: 'Logo actualizado en toda la tienda.' });
      } catch (_) {
        if (filename) await fs.unlink(path.join(uploadDir, filename)).catch(() => {});
        res.status(500).json({ mensaje: 'No se pudo guardar el logo.' });
      }
    });
  });
  router.delete('/marca/logo', verificarToken, soloAdmin, async (req, res) => {
    try { res.json({ ...await save({ logo_url: '', updated_at: new Date().toISOString() }), mensaje: 'Logo original restaurado.' }); }
    catch (_) { res.status(500).json({ mensaje: 'No se pudo restaurar el logo.' }); }
  });
  return router;
}

module.exports = createRouter();
module.exports.createRouter = createRouter;
