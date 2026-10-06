# Seguridad del repositorio

- No subir archivos `.env`.
- No publicar contraseñas, tokens, claves JWT ni credenciales de MySQL.
- No subir documentos o imágenes personales cargados por usuarios/vendedores.
- Los directorios `backend/uploads/` se mantienen vacíos en Git mediante `.gitkeep`.
- Antes de cada publicación, revisar los cambios con `git diff` y `git status`.
