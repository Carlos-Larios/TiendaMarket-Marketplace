# TiendaPro Marketplace

Proyecto personal de aprendizaje creado para practicar desarrollo web y comprender el funcionamiento de una tienda en línea tipo marketplace.

> **Estado:** proyecto en desarrollo. Lo utilizo como práctica para continuar aprendiendo programación, bases de datos, pruebas y organización de una aplicación web.

![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111111)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

## Tecnologías que estoy practicando

- HTML y CSS
- JavaScript
- Node.js
- Express
- MySQL
- JWT y bcrypt para prácticas de autenticación
- Git y GitHub
- Postman para probar endpoints

## Funciones incluidas en el proyecto

El proyecto contiene distintas áreas que he ido desarrollando y probando, entre ellas:

- Registro e inicio de sesión.
- Catálogo y visualización de productos.
- Carrito y flujo de pedidos.
- Panel de administración.
- Panel y catálogo para vendedores.
- Inventario y gestión de productos.
- Facturación y devoluciones.
- Analíticas y configuración de la tienda.

No todas las funciones están finalizadas y algunas continúan en proceso de mejora.

## Capturas del proyecto

Estas capturas muestran algunas pantallas del proyecto en su estado actual. Los textos visibles son datos de prueba usados durante el desarrollo.

### Inicio de la tienda

![Inicio de la tienda](screenshots/inicio-tienda.png)

### Detalle de producto

![Detalle de producto](screenshots/detalle-producto.png)

### Perfil del vendedor

![Perfil del vendedor](screenshots/perfil-vendedor.png)

### Inicio de sesión

![Inicio de sesión](screenshots/inicio-sesion.png)

### Ajustes de apariencia

![Ajustes de apariencia](screenshots/ajustes-apariencia.png)

## Estructura general

```text
backend/     Servidor, rutas, autenticación y conexión con MySQL
frontend/    Páginas, estilos y JavaScript de la interfaz
screenshots/ Capturas usadas para documentar el proyecto
```

## Configuración local

### 1. Requisitos

- Node.js
- MySQL
- npm

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Variables de entorno

Copia `backend/.env.example` como `backend/.env` y configura los datos de tu base de datos local y un `JWT_SECRET` propio.

**El archivo `.env` no debe publicarse.**

### 4. Iniciar el backend

```bash
npm run dev
```

El servidor utiliza por defecto el puerto `3000`.

## Nota sobre la base de datos

Este repositorio para portafolio no incluye una base de datos con información real ni credenciales privadas. Para ejecutar todas las funciones es necesario disponer del esquema MySQL compatible con el proyecto.

## Objetivo del proyecto

TiendaPro no se presenta como un producto comercial terminado. Es un proyecto personal que utilizo para aplicar lo aprendido, detectar errores, realizar pruebas y familiarizarme con el desarrollo de aplicaciones web.
