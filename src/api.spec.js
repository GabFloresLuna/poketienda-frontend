import { ApiError, borrarTokens, leerToken } from './api.js';
import { productosServicio } from './servicios/productosServicio.js';
import { usuariosServicio } from './servicios/usuariosServicio.js';

const responder = (estado, cuerpo) => Promise.resolve(new Response(cuerpo === null ? null : JSON.stringify(cuerpo), { status: estado }));

describe('api.js y servicios', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => borrarTokens());

  it('productosServicio traduce imagenUrl a img y descripcion a desc', async () => {
    spyOn(window, 'fetch').and.callFake(() =>
      responder(200, [{ id: 1, codigo: 'P001', nombre: 'Figura', descripcion: 'Una figura', precio: 1000, precioOferta: null, oferta: false, stock: 5, stockCritico: 3, imagenUrl: '/images/a.jpg', categoriaId: 1, categoria: 'Figuras' }])
    );
    const [p] = await productosServicio.listar();
    expect(p.img).toBe('/images/a.jpg');
    expect(p.desc).toBe('Una figura');
    expect(p.categoria).toBe('Figuras');
  });

  it('un error del backend se convierte en ApiError con código, mensaje y campos', async () => {
    spyOn(window, 'fetch').and.callFake(() => responder(400, { codigo: 400, mensaje: 'Datos inválidos', campos: { nombre: 'Obligatorio' } }));
    try {
      await productosServicio.obtener(1);
      fail('debía lanzar ApiError');
    } catch (e) {
      expect(e instanceof ApiError).toBe(true);
      expect(e.codigo).toBe(400);
      expect(e.campos.nombre).toBe('Obligatorio');
    }
  });

  it('si el servidor no responde, lanza ApiError con código 0', async () => {
    spyOn(window, 'fetch').and.callFake(() => Promise.reject(new TypeError('fallo de red')));
    try {
      await productosServicio.listar();
      fail('debía lanzar ApiError');
    } catch (e) {
      expect(e.codigo).toBe(0);
    }
  });

  it('con un 401 renueva el token con el refresh token y repite la petición', async () => {
    localStorage.setItem('poketienda-token', 'vencido');
    localStorage.setItem('poketienda-refresh', 'refresco');
    const llamada = spyOn(window, 'fetch').and.returnValues(
      responder(401, { codigo: 401, mensaje: 'Debes iniciar sesión', campos: null }),
      responder(200, { accessToken: 'nuevo', refreshToken: 'refresco-nuevo' }),
      responder(200, [])
    );
    const lista = await usuariosServicio.listar();
    expect(lista).toEqual([]);
    expect(llamada.calls.argsFor(1)[0]).toContain('/auth/refresh');
    expect(llamada.calls.argsFor(2)[1].headers.Authorization).toBe('Bearer nuevo');
    expect(leerToken()).toBe('nuevo');
  });
});
