import { ventasApi } from '../api.js';

export const ventasServicio = {
  /** Registra una compra. `items` = [{ productoId, cantidad }]; el total lo calcula el backend. */
  crear: (boleta) => ventasApi.post('/boletas', boleta),
  listar: () => ventasApi.get('/boletas'),
  obtener: (id) => ventasApi.get(`/boletas/${id}`),
  mias: () => ventasApi.get('/boletas/mias'),
  cambiarEstado: (id, estado) => ventasApi.patch(`/boletas/${id}/estado`, { estado }),
  resumen: () => ventasApi.get('/reportes/resumen'),
};
