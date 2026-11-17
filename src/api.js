/**
 * api.js — Cliente HTTP del frontend para los tres microservicios.
 * Las URL se pueden cambiar con variables de Vite (.env); si no existen, se usan las de localhost.
 * Si el access token vence (401), se renueva solo con el refresh token y se repite la petición una vez.
 */
const URL_USUARIOS = import.meta.env?.VITE_URL_USUARIOS ?? 'http://localhost:8081/api/v1';
const URL_PRODUCTOS = import.meta.env?.VITE_URL_PRODUCTOS ?? 'http://localhost:8082/api/v1';
const URL_VENTAS = import.meta.env?.VITE_URL_VENTAS ?? 'http://localhost:8083/api/v1';

const CLAVE_TOKEN = 'poketienda-token';
const CLAVE_REFRESH = 'poketienda-refresh';
export const EVENTO_SESION_EXPIRADA = 'poketienda:sesion-expirada';

export const leerToken = () => localStorage.getItem(CLAVE_TOKEN);
export const guardarTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem(CLAVE_TOKEN, accessToken);
  localStorage.setItem(CLAVE_REFRESH, refreshToken);
};
export const borrarTokens = () => {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_REFRESH);
};

/** Error del backend: conserva el código HTTP, el mensaje y los errores por campo. */
export class ApiError extends Error {
  constructor(codigo, mensaje, campos = null) {
    super(mensaje);
    this.codigo = codigo;
    this.campos = campos;
  }
}

let renovacion = null; // evita pedir varios refresh a la vez

/** Pide un access token nuevo. Devuelve true si lo logró. */
function renovar() {
  const refreshToken = localStorage.getItem(CLAVE_REFRESH);
  if (!refreshToken) return Promise.resolve(false);
  renovacion ??= fetch(`${URL_USUARIOS}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      guardarTokens(await r.json());
      return true;
    })
    .catch(() => false)
    .finally(() => {
      renovacion = null;
    });
  return renovacion;
}

async function pedir(base, ruta, { metodo = 'GET', cuerpo } = {}, reintento = false) {
  const cabeceras = { 'Content-Type': 'application/json' };
  const token = leerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.');
  }

  if (respuesta.status === 401 && token && !reintento && !ruta.startsWith('/auth/')) {
    if (await renovar()) return pedir(base, ruta, { metodo, cuerpo }, true);
    borrarTokens();
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos?.mensaje ?? 'Error inesperado.', datos?.campos ?? null);
  }
  return datos;
}

/** Un cliente por microservicio, todos con la misma forma. */
const cliente = (base) => ({
  get: (ruta) => pedir(base, ruta),
  post: (ruta, cuerpo) => pedir(base, ruta, { metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo) => pedir(base, ruta, { metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo) => pedir(base, ruta, { metodo: 'PATCH', cuerpo }),
  delete: (ruta) => pedir(base, ruta, { metodo: 'DELETE' }),
});

export const usuariosApi = cliente(URL_USUARIOS);
export const productosApi = cliente(URL_PRODUCTOS);
export const ventasApi = cliente(URL_VENTAS);
