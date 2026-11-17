import { useState } from 'react';
import { Link } from 'react-router-dom';
import Campo from '../components/Campo.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { categoriasServicio } from '../servicios/categoriasServicio.js';
import { productosServicio } from '../servicios/productosServicio.js';
import { usuariosServicio } from '../servicios/usuariosServicio.js';
import { ventasServicio } from '../servicios/ventasServicio.js';
import { V, formatoCLP, precioFinal } from '../utils.js';

const VACIO = {
  codigo: '', nombre: '', categoriaId: '', precio: '', stock: '', stockCritico: '3',
  img: '/images/perlaCosmicaDecorativa.jpg', desc: '', plataforma: '', oferta: false, precioOferta: '',
};
// Flujo lineal de la boleta: solo se puede avanzar al siguiente estado o anular.
const SIGUIENTE = { PAGADA: 'ENVIADA', ENVIADA: 'ENTREGADA' };
const ANULABLES = ['PAGADA', 'ENVIADA'];
// El backend nombra distinto dos campos del producto.
const CAMPO_FORM = { imagenUrl: 'img', descripcion: 'desc' };
const aCamposForm = (campos) => Object.fromEntries(Object.entries(campos ?? {}).map(([k, v]) => [CAMPO_FORM[k] ?? k, v]));

/** Panel de administración: solo para el rol ADMIN. */
export default function Admin() {
  const { usuario } = useApp();
  if (usuario?.rol !== 'ADMIN') {
    return (
      <div className="pagina-acceso-restringido text-center py-5">
        <h1>Acceso restringido</h1>
        <p>Esta sección es solo para administradores.</p>
        <Link to="/login" className="btn boton-perla">Iniciar sesión</Link>
      </div>
    );
  }
  return <PanelAdmin />;
}

function PanelAdmin() {
  const productos = useCarga(() => productosServicio.listar());
  const categorias = useCarga(() => categoriasServicio.listar());
  const usuarios = useCarga(() => usuariosServicio.listar());
  const boletas = useCarga(() => ventasServicio.listar());
  const resumen = useCarga(() => ventasServicio.resumen());

  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const listaProductos = productos.datos ?? [];
  const listaCategorias = categorias.datos ?? [];
  const listaBoletas = [...(boletas.datos ?? [])].sort((a, b) => b.id - a.id);
  const criticos = listaProductos.filter((p) => p.stock <= p.stockCritico).length;
  const errorCarga = [productos, categorias, usuarios, boletas, resumen].find((c) => c.error)?.error;

  const cambiar = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const limpiarForm = () => {
    setEditando(null);
    setForm(VACIO);
    setErrores({});
  };

  // CREATE / UPDATE
  const guardar = async (e) => {
    e.preventDefault();
    const nuevos = {
      codigo: V.requerido(form.codigo, 'El código'),
      nombre: V.requerido(form.nombre, 'El nombre'),
      categoriaId: V.requerido(form.categoriaId, 'La categoría'),
      precio: Number(form.precio) > 0 ? '' : 'El precio debe ser mayor que 0.',
      stock: form.stock !== '' && Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0 ? '' : 'El stock debe ser un entero desde 0.',
      stockCritico: form.stockCritico !== '' && Number.isInteger(Number(form.stockCritico)) && Number(form.stockCritico) >= 0 ? '' : 'El stock crítico debe ser un entero desde 0.',
      precioOferta: form.oferta && !(Number(form.precioOferta) > 0 && Number(form.precioOferta) < Number(form.precio)) ? 'El precio de oferta debe ser menor al precio.' : '',
    };
    setErrores(nuevos);
    setAviso('');
    if (Object.values(nuevos).some(Boolean)) return;

    try {
      if (editando) await productosServicio.actualizar(editando, form);
      else await productosServicio.crear(form);
      limpiarForm();
      productos.recargar();
    } catch (err) {
      setErrores(aCamposForm(err.campos));
      setAviso(err.message);
    }
  };

  const editar = (p) => {
    setEditando(p.id);
    setForm({
      ...VACIO, ...p,
      categoriaId: String(p.categoriaId), desc: p.desc ?? '', plataforma: p.plataforma ?? '', img: p.img ?? '',
      oferta: Boolean(p.oferta), precioOferta: p.precioOferta ?? '',
    });
    setErrores({});
  };

  // DELETE
  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await productosServicio.eliminar(p.id);
      productos.recargar();
    } catch (err) {
      setAviso(err.message);
    }
  };

  const crearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return setAviso('El nombre de la categoría es obligatorio.');
    try {
      await categoriasServicio.crear({ nombre: nuevaCategoria.trim() });
      setNuevaCategoria('');
      setAviso('');
      categorias.recargar();
    } catch (err) {
      setAviso(err.message);
    }
  };

  const eliminarCategoria = async (c) => {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    try {
      await categoriasServicio.eliminar(c.id);
      categorias.recargar();
    } catch (err) {
      setAviso(err.message); // 409 si todavía tiene productos
    }
  };

  const cambiarEstado = async (b, estado) => {
    try {
      await ventasServicio.cambiarEstado(b.id, estado);
      setAviso('');
      boletas.recargar();
      resumen.recargar();
      if (estado === 'ANULADA') productos.recargar(); // anular repone el stock
    } catch (err) {
      setAviso(err.message);
    }
  };

  return (
    <>
      <h1 className="h2 mb-3">Panel de administración</h1>
      {errorCarga && <div className="alert alert-danger" role="alert">{errorCarga}</div>}
      {aviso && <div className="aviso-admin alert alert-warning" role="alert">{aviso}</div>}

      <div className="fila-metricas row g-3 mb-4 text-center">
        {[
          ['Productos', listaProductos.length],
          ['Stock crítico', criticos],
          ['Usuarios', usuarios.datos?.length ?? 0],
          ['Boletas', boletas.datos?.length ?? 0],
        ].map(([etiqueta, valor]) => (
          <div className="columna-metrica col-6 col-md-3" key={etiqueta}>
            <div className="tarjeta-metrica card p-3"><div className="etiqueta-metrica small text-secondary">{etiqueta}</div><div className="valor-metrica fs-3 fw-bold">{valor}</div></div>
          </div>
        ))}
      </div>

      {resumen.datos && (
        <div className="reporte-ventas card p-3 mb-4">
          <h2 className="h5">Resumen de ventas</h2>
          <p className="mb-1">Total vendido: <strong>{formatoCLP(resumen.datos.totalVendido)}</strong> · Ticket promedio: <strong>{formatoCLP(resumen.datos.ticketPromedio)}</strong></p>
          {resumen.datos.masVendidos.length > 0 && (
            <ol className="mb-0 small">
              {resumen.datos.masVendidos.map((m) => <li key={m.productoId}>{m.nombreProducto} · {m.cantidadVendida} u.</li>)}
            </ol>
          )}
        </div>
      )}

      <h2 className="h4">{editando ? `Editar producto ${form.codigo}` : 'Nuevo producto'}</h2>
      <form className="formulario-producto row g-3 mb-4" onSubmit={guardar} noValidate>
        <div className="columna-codigo col-md-3"><Campo id="codigo" etiqueta="Código" value={form.codigo} onChange={cambiar} error={errores.codigo} /></div>
        <div className="columna-nombre col-md-5"><Campo id="nombre" etiqueta="Nombre" value={form.nombre} onChange={cambiar} error={errores.nombre} /></div>
        <div className="columna-categoria col-md-4">
          <Campo id="categoriaId" etiqueta="Categoría" como="select" value={form.categoriaId} onChange={cambiar} error={errores.categoriaId}>
            <option value="">Selecciona…</option>
            {listaCategorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Campo>
        </div>
        <div className="columna-precio col-md-3"><Campo id="precio" etiqueta="Precio" type="number" value={form.precio} onChange={cambiar} error={errores.precio} /></div>
        <div className="columna-stock col-md-3"><Campo id="stock" etiqueta="Stock" type="number" value={form.stock} onChange={cambiar} error={errores.stock} /></div>
        <div className="columna-stock-critico col-md-3"><Campo id="stockCritico" etiqueta="Stock crítico" type="number" value={form.stockCritico} onChange={cambiar} error={errores.stockCritico} /></div>
        <div className="columna-plataforma col-md-3"><Campo id="plataforma" etiqueta="Plataforma (opcional)" value={form.plataforma} onChange={cambiar} error={errores.plataforma} /></div>
        <div className="columna-imagen col-md-6"><Campo id="img" etiqueta="Ruta de la imagen" value={form.img} onChange={cambiar} error={errores.img} /></div>
        <div className="columna-descripcion col-md-6"><Campo id="desc" etiqueta="Descripción" value={form.desc} onChange={cambiar} error={errores.desc} /></div>
        <div className="columna-oferta col-md-3 d-flex align-items-center">
          <div className="casilla-oferta form-check">
            <input className="form-check-input" type="checkbox" id="oferta" name="oferta" checked={form.oferta} onChange={cambiar} />
            <label className="form-check-label" htmlFor="oferta">En oferta</label>
          </div>
        </div>
        {form.oferta && <div className="columna-precio-oferta col-md-3"><Campo id="precioOferta" etiqueta="Precio de oferta" type="number" value={form.precioOferta} onChange={cambiar} error={errores.precioOferta} /></div>}
        <div className="columna-botones col-12 d-flex gap-2">
          <button type="submit" className="btn boton-perla">{editando ? 'Guardar cambios' : 'Crear producto'}</button>
          {editando && <button type="button" className="btn btn-outline-light" onClick={limpiarForm}>Cancelar</button>}
        </div>
      </form>

      <h2 className="h4">Productos</h2>
      <div className="tabla-productos table-responsive mb-4">
        <table className="table align-middle">
          <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {listaProductos.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>{p.categoria}</td>
                <td>{formatoCLP(precioFinal(p))}</td>
                <td>{p.stock} {p.stock <= p.stockCritico && <span className="badge text-bg-warning">Crítico</span>}</td>
                <td className="celda-acciones text-nowrap">
                  <button type="button" className="btn btn-sm btn-outline-light me-1" onClick={() => editar(p)}>Editar</button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminar(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h4">Categorías</h2>
      <form className="formulario-categoria d-flex gap-2 mb-2" onSubmit={crearCategoria} noValidate>
        <input className="form-control" aria-label="Nueva categoría" placeholder="Nueva categoría" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} />
        <button type="submit" className="btn boton-perla text-nowrap">Agregar</button>
      </form>
      <ul className="lista-categorias list-unstyled mb-4">
        {listaCategorias.map((c) => (
          <li key={c.id} className="d-flex align-items-center gap-2 mb-1">
            <span>{c.nombre}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarCategoria(c)}>Eliminar</button>
          </li>
        ))}
      </ul>

      <h2 className="h4">Boletas recientes</h2>
      {listaBoletas.length === 0 ? (
        <p className="text-secondary">Aún no hay boletas.</p>
      ) : (
        <div className="tabla-boletas table-responsive">
          <table className="table align-middle">
            <thead><tr><th>N°</th><th>Cliente</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {listaBoletas.slice(0, 10).map((b) => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td>{b.nombre} {b.apellidos}</td>
                  <td>{formatoCLP(b.total)}</td>
                  <td>{b.estado}</td>
                  <td className="text-nowrap">
                    {SIGUIENTE[b.estado] && <button type="button" className="btn btn-sm btn-outline-light me-1" onClick={() => cambiarEstado(b, SIGUIENTE[b.estado])}>Marcar {SIGUIENTE[b.estado].toLowerCase()}</button>}
                    {ANULABLES.includes(b.estado) && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => cambiarEstado(b, 'ANULADA')}>Anular</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
