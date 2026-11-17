import { productosApi } from '../api.js';

/**
 * Traduce un producto del backend a la forma que ya usan los componentes:
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

export const productosServicio = {
  listar: async () => (await productosApi.get('/productos')).map(aProductoFront),
  obtener: async (id) => aProductoFront(await productosApi.get(`/productos/${id}`)),
};
