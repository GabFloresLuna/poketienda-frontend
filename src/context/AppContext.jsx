import { createContext, useContext, useEffect, useState } from 'react';
import { EVENTO_SESION_EXPIRADA, borrarTokens, leerToken } from '../api.js';
import { authServicio } from '../servicios/authServicio.js';
import { precioFinal } from '../utils.js';

const AppContext = createContext(null);
const MAX_POR_ITEM = 10;

const cargar = (clave, defecto) => {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch {
    return defecto;
  }
};

/**
 * Estado compartido de toda la app: el carrito (lo leen el header, el carrito y las tarjetas)
 * y la sesión del usuario. Ambos se guardan en localStorage.
 */
export function AppProvider({ children }) {
  const [carrito, setCarrito] = useState(() => cargar('poketienda-carrito-v2', []));
  const [usuario, setUsuario] = useState(() => (leerToken() ? cargar('poketienda-sesion', null) : null));

  useEffect(() => localStorage.setItem('poketienda-carrito-v2', JSON.stringify(carrito)), [carrito]);
  useEffect(() => localStorage.setItem('poketienda-sesion', JSON.stringify(usuario)), [usuario]);

  // Si el backend rechaza el token (vencido y sin refresh válido), se cierra la sesión.
  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  /* ---- carrito ---- */
  const agregar = (producto, cantidad = 1) =>
    setCarrito((c) =>
      c.some((i) => i.id === producto.id)
        ? c.map((i) => (i.id === producto.id ? { ...i, cantidad: Math.min(MAX_POR_ITEM, i.cantidad + cantidad) } : i))
        : [...c, { id: producto.id, nombre: producto.nombre, img: producto.img, precio: precioFinal(producto), cantidad }]
    );
  const cambiarCantidad = (id, delta) =>
    setCarrito((c) => c.map((i) => (i.id === id ? { ...i, cantidad: Math.min(MAX_POR_ITEM, Math.max(1, i.cantidad + delta)) } : i)));
  const quitar = (id) => setCarrito((c) => c.filter((i) => i.id !== id));
  const vaciar = () => setCarrito([]);

  /* ---- sesión (ms-usuarios) ---- */
  /** Inicia sesión con el backend. Devuelve el usuario o lanza ApiError (401 si las credenciales son incorrectas). */
  const iniciarSesion = async (correo, password) => {
    const u = await authServicio.login(correo.trim(), password);
    setUsuario(u);
    return u;
  };
  /** Crea una cuenta de cliente e inicia sesión. Lanza ApiError si el backend rechaza los datos. */
  const registrar = async (datos) => {
    await authServicio.registro(datos);
    return iniciarSesion(datos.correo, datos.password);
  };
  const cerrarSesion = () => {
    borrarTokens();
    setUsuario(null);
  };

  /* ---- valores derivados: se calculan, no se guardan ---- */
  const cantidad = carrito.reduce((s, i) => s + i.cantidad, 0);
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const valor = { carrito, cantidad, total, agregar, cambiarCantidad, quitar, vaciar, usuario, iniciarSesion, registrar, cerrarSesion };
  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>.');
  return ctx;
}
