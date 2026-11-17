import { productosApi } from '../api.js';

export const categoriasServicio = {
  listar: () => productosApi.get('/categorias'),
  crear: (categoria) => productosApi.post('/categorias', categoria),
  eliminar: (id) => productosApi.delete(`/categorias/${id}`),
};
