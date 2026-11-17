import { usuariosApi } from '../api.js';

export const usuariosServicio = {
  /** Solo ADMIN. */
  listar: () => usuariosApi.get('/usuarios'),
};
