import { guardarTokens, usuariosApi } from '../api.js';

export const authServicio = {
  /** Inicia sesión, guarda los tokens y devuelve el usuario. */
  async login(correo, password) {
    const respuesta = await usuariosApi.post('/auth/login', { correo, password });
    guardarTokens(respuesta);
    return respuesta.usuario;
  },
  /** Crea una cuenta de cliente. El backend no devuelve tokens: quien llama debe iniciar sesión después. */
  registro: (datos) => usuariosApi.post('/auth/registro', datos),
};
