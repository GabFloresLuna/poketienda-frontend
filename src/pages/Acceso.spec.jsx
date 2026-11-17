import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext.jsx';
import Acceso from './Acceso.jsx';

const montar = (modo) => render(<MemoryRouter><AppProvider><Acceso modo={modo} /></AppProvider></MemoryRouter>);
const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
// Jasmine no lanza error en `expect`, así que waitFor necesita una condición que lance.
const esperar = (condicion) => waitFor(() => { if (!condicion()) throw new Error('La condición aún no se cumple.'); });
const responder = (estado, cuerpo) => Promise.resolve(new Response(JSON.stringify(cuerpo), { status: estado }));

const USUARIO = { id: 1, nombre: 'Admin', apellidos: 'Pearl', correo: 'admin@duoc.cl', rol: 'ADMIN' };
const TOKENS = { accessToken: 'acceso-1', refreshToken: 'refresco-1', tipo: 'Bearer', expiraEnSegundos: 900, usuario: USUARIO };

describe('<Acceso /> — login y registro (ms-usuarios)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('RENDERIZADO CONDICIONAL: en login no pide nombre; en registro sí', () => {
    montar('login');
    expect(screen.queryByLabelText('Nombre')).toBeNull();
    cleanup();
    montar('registro');
    expect(screen.getByLabelText('Nombre')).toBeTruthy();
    expect(screen.getByLabelText(/^RUN/)).toBeTruthy();
  });

  it('RENDERIZADO CONDICIONAL: los errores solo aparecen al enviar un formulario inválido', () => {
    montar('login');
    expect(screen.queryAllByRole('alert').length).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('ESTADO: el campo guarda lo que el usuario escribe', () => {
    montar('login');
    escribir('Correo electrónico', 'ana@gmail.com');
    expect(screen.getByLabelText('Correo electrónico').value).toBe('ana@gmail.com');
  });

  it('EVENTOS: si el backend responde 401 se muestra su mensaje y no se guarda sesión', async () => {
    spyOn(window, 'fetch').and.callFake(() => responder(401, { codigo: 401, mensaje: 'Correo o contraseña incorrectos', campos: null }));
    montar('login');
    escribir('Correo electrónico', 'admin@duoc.cl');
    escribir(/^Contraseña/, 'Mala1234');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeTruthy();
    expect(localStorage.getItem('poketienda-token')).toBeNull();
  });

  it('EVENTOS: un login correcto guarda los tokens y la sesión del administrador', async () => {
    const llamada = spyOn(window, 'fetch').and.callFake(() => responder(200, TOKENS));
    montar('login');
    escribir('Correo electrónico', 'admin@duoc.cl');
    escribir(/^Contraseña/, 'Admin123');
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await esperar(() => localStorage.getItem('poketienda-token') === 'acceso-1');
    expect(localStorage.getItem('poketienda-refresh')).toBe('refresco-1');
    expect(JSON.parse(localStorage.getItem('poketienda-sesion')).rol).toBe('ADMIN');
    expect(llamada.calls.mostRecent().args[0]).toContain('/auth/login');
  });

  it('EVENTOS: registro con contraseñas distintas no llama al backend', () => {
    const llamada = spyOn(window, 'fetch');
    montar('registro');
    escribir(/^RUN/, '12345678-5');
    escribir('Nombre', 'Ana');
    escribir('Apellidos', 'Pérez');
    escribir('Correo electrónico', 'ana@gmail.com');
    escribir(/^Contraseña \(/, '123456');
    escribir('Confirmar contraseña', '999999');
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }));
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
    expect(llamada).not.toHaveBeenCalled();
  });

  it('EVENTOS: un registro válido crea la cuenta y luego inicia sesión', async () => {
    const llamada = spyOn(window, 'fetch').and.callFake((url) =>
      url.includes('/auth/registro') ? responder(201, { ...USUARIO, rol: 'CLIENTE' }) : responder(200, { ...TOKENS, usuario: { ...USUARIO, rol: 'CLIENTE' } })
    );
    montar('registro');
    escribir(/^RUN/, '12345678-5');
    escribir('Nombre', 'Ana');
    escribir('Apellidos', 'Pérez');
    escribir('Correo electrónico', 'ana@gmail.com');
    escribir(/^Contraseña \(/, '123456');
    escribir('Confirmar contraseña', '123456');
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }));
    await esperar(() => llamada.calls.count() === 2);
    expect(llamada.calls.argsFor(0)[0]).toContain('/auth/registro');
    expect(llamada.calls.argsFor(1)[0]).toContain('/auth/login');
  });

  it('EVENTOS: los errores por campo del backend (400) se muestran junto al campo', async () => {
    spyOn(window, 'fetch').and.callFake(() => responder(400, { codigo: 400, mensaje: 'Datos inválidos', campos: { run: 'El RUN no es válido' } }));
    montar('registro');
    escribir(/^RUN/, '11111111-9');
    escribir('Nombre', 'Ana');
    escribir('Apellidos', 'Pérez');
    escribir('Correo electrónico', 'ana@gmail.com');
    escribir(/^Contraseña \(/, '123456');
    escribir('Confirmar contraseña', '123456');
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }));
    expect(await screen.findByText('El RUN no es válido')).toBeTruthy();
  });
});
