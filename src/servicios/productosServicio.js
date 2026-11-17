import { productosApi } from '../api.js';

/**
 * Traduce un producto del backend a la forma que usan los componentes:
 * imagenUrl -> img y descripcion -> desc. El resto de los campos se mantiene.
 */
export const aProductoFront = (p) => ({
  id: p.id,
  codigo: p.codigo,
  nombre: p.nombre,
  desc: p.descripcion,
  plataforma: p.plataforma,
  categoria: p.categoria,
  categoriaId: p.categoriaId,
  precio: p.precio,
  precioOferta: p.precioOferta,
  oferta: p.oferta,
  stock: p.stock,
  stockCritico: p.stockCritico,
  img: p.imagenUrl,
});

/** Traduce el formulario del admin al ProductoRequest del backend. */
export const aProductoRequest = (f) => ({
  codigo: f.codigo.trim(),
  nombre: f.nombre.trim(),
  descripcion: f.desc?.trim() || null,
  plataforma: f.plataforma?.trim() || null,
  precio: Number(f.precio),
  precioOferta: f.oferta ? Number(f.precioOferta) : null,
  stock: Number(f.stock),
  stockCritico: Number(f.stockCritico),
  imagenUrl: f.img?.trim() || null,
  categoriaId: Number(f.categoriaId),
});

export const productosServicio = {
  listar: async ({ categoriaId, texto } = {}) => {
    const filtros = new URLSearchParams();
    if (categoriaId) filtros.set('categoriaId', categoriaId);
    if (texto) filtros.set('texto', texto);
    const consulta = filtros.toString();
    return (await productosApi.get(`/productos${consulta ? `?${consulta}` : ''}`)).map(aProductoFront);
  },
  obtener: async (id) => aProductoFront(await productosApi.get(`/productos/${id}`)),
  crear: async (formulario) => aProductoFront(await productosApi.post('/productos', aProductoRequest(formulario))),
  actualizar: async (id, formulario) => aProductoFront(await productosApi.put(`/productos/${id}`, aProductoRequest(formulario))),
  eliminar: (id) => productosApi.delete(`/productos/${id}`),
};
