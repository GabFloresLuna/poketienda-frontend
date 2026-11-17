import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext.jsx';
import { formatoCLP } from '../utils.js';
import Carrito from './Carrito.jsx';

const ITEMS = [
  { id: 1, nombre: 'Figura Palkia Legendaria', img: '/x.jpg', precio: 24990, cantidad: 2 },
  { id: 3, nombre: 'Set de Cartas Sinnoh', img: '/y.jpg', precio: 6990, cantidad: 1 },
];
const montar = (items = ITEMS) => {
  localStorage.setItem('poketienda-carrito-v2', JSON.stringify(items));
  return render(<MemoryRouter><AppProvider><Carrito /></AppProvider></MemoryRouter>);
};
const completar = () => {
  [['Nombre', 'Ana'], ['Apellidos', 'Pérez'], ['Correo', 'ana@gmail.com'], ['Calle y número', 'Calle 1 #123'], ['Región', 'Metropolitana'], ['Comuna', 'Renca']]
    .forEach(([etiqueta, valor]) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } }));
};
const responder = (estado, cuerpo) => Promise.resolve(new Response(JSON.stringify(cuerpo), { status: estado }));
const guardado = () => JSON.parse(localStorage.getItem('poketienda-carrito-v2'));

describe('<Carrito /> (ms-ventas)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('RENDERIZADO DE LISTA: muestra una fila por cada producto del carrito', () => {
    montar();
    expect(screen.getByText(/Figura Palkia Legendaria/)).toBeTruthy();
    expect(screen.getByText(/Set de Cartas Sinnoh/)).toBeTruthy();
  });

  it('RENDERIZADO CONDICIONAL: con el carrito vacío muestra el mensaje y no el formulario de pago', () => {
    montar([]);
    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Pagar/ })).toBeNull();
  });

  it('EVENTOS + ESTADO: el botón + aumenta la cantidad y actualiza el total', () => {
    montar();
    expect(screen.getByRole('button', { name: /Pagar/ }).textContent).toContain(formatoCLP(24990 * 2 + 6990));
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar Figura Palkia Legendaria' }));
    expect(screen.getByRole('button', { name: /Pagar/ }).textContent).toContain(formatoCLP(24990 * 3 + 6990));
  });

  it('RENDERIZADO CONDICIONAL: pagar sin datos muestra errores y no llama al backend', () => {
    const llamada = spyOn(window, 'fetch');
    montar();
    fireEvent.click(screen.getByRole('button', { name: /Pagar/ }));
    expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy();
    expect(llamada).not.toHaveBeenCalled();
  });

  it('EVENTOS: compra exitosa envía solo productoId y cantidad, confirma la boleta y vacía el carrito', async () => {
    const llamada = spyOn(window, 'fetch').and.callFake(() => responder(201, { id: 7, total: 56970, estado: 'PAGADA' }));
    montar();
    completar();
    fireEvent.click(screen.getByRole('button', { name: /Pagar/ }));
    expect(await screen.findByText('¡Compra realizada!')).toBeTruthy();
    const [url, opciones] = llamada.calls.mostRecent().args;
    expect(url).toContain('/boletas');
    expect(JSON.parse(opciones.body).items).toEqual([{ productoId: 1, cantidad: 2 }, { productoId: 3, cantidad: 1 }]);
    await waitFor(() => expect(guardado().length).toBe(0));
  });

  it('EVENTOS: sin stock (409) muestra el mensaje del backend y conserva el carrito', async () => {
    spyOn(window, 'fetch').and.callFake(() => responder(409, { codigo: 409, mensaje: 'Stock insuficiente para Figura Palkia Legendaria', campos: null }));
    montar();
    completar();
    fireEvent.click(screen.getByRole('button', { name: /Pagar/ }));
    expect(await screen.findByText('Stock insuficiente para Figura Palkia Legendaria')).toBeTruthy();
    expect(guardado().length).toBe(2);
  });
});
