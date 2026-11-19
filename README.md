# PokéTienda Pearl · Frontend

Frontend de la tienda online PokéTienda Pearl (Evaluación Parcial 3 de DSY1104 Desarrollo Fullstack II, Duoc UC). Es una aplicación React 18 con Vite, React Router y Bootstrap que consume la API de los tres microservicios del backend: https://github.com/GabFloresLuna/poketienda-backend

## Requisitos

- Node.js (con npm)
- Backend en ejecución: ms-usuarios (8081), ms-productos (8082) y ms-ventas (8083). Ver el README del repositorio del backend (variables de entorno, bases de datos y orden de arranque).
- Google Chrome (solo para las pruebas)

## Cómo ejecutarlo

```bash
git clone https://github.com/GabFloresLuna/poketienda-frontend.git
cd poketienda-frontend
```

Con el backend ya levantado:

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm test         # Jasmine + Karma
```

El backend permite las solicitudes desde `http://localhost:5173` y `http://localhost:3000`.

## Día de la presentación

1. Levantar el backend siguiendo su README: MySQL encendido, variables `DB_USER`, `DB_PASSWORD` y `JWT_SECRET`, y los tres microservicios (ms-productos, ms-usuarios, ms-ventas).
2. En este repositorio: `npm run dev`.
3. Abrir http://localhost:5173 e ingresar con una de las cuentas de prueba.

## Variables de entorno

Por defecto el frontend usa los microservicios en `localhost`. Si corren en otras direcciones, copiar `.env.example` como `.env` y ajustar:

| Variable | Valor por defecto |
|---|---|
| `VITE_URL_USUARIOS` | http://localhost:8081/api/v1 |
| `VITE_URL_PRODUCTOS` | http://localhost:8082/api/v1 |
| `VITE_URL_VENTAS` | http://localhost:8083/api/v1 |

## Cuentas de prueba

Las crea el backend al primer arranque.

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@duoc.cl | Admin123 |
| Vendedor | vendedor@duoc.cl | Vendedor123 |
| Cliente | cliente@gmail.com | Cliente123 |

## Estructura

```
src/
  main.jsx · App.jsx · styles.css · utils.js · api.js
  servicios/     authServicio, usuariosServicio, productosServicio,
                 categoriasServicio, ventasServicio
  context/       AppContext.jsx (carrito y sesión)
  hooks/         useCarga.js
  components/    Logo, Campo, CardProducto, EstadoCarga, Header, Footer
  pages/         Home, Productos, DetalleProducto, Carrito, Acceso,
                 Contacto, Nosotros, Blogs, Admin
test/setup.js
```

## Pruebas (Jasmine + Karma)

Archivos `*.spec.js(x)` junto al código: `api`, `utils`, `data/db`, `CardProducto`, `Header`, `Acceso` y `Carrito`. Se ejecutan con `npm test`.
