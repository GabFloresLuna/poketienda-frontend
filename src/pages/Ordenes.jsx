import { useState } from 'react';
import { Link } from 'react-router-dom';
import EstadoCarga from '../components/EstadoCarga.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { ventasServicio } from '../servicios/ventasServicio.js';
import { formatoCLP } from '../utils.js';

/** Vista de solo lectura para el vendedor: lista de órdenes y su detalle. */
export default function Ordenes() {
  const { usuario } = useApp();
  if (usuario?.rol !== 'VENDEDOR' && usuario?.rol !== 'ADMIN') {
    return (
      <div className="pagina-acceso-restringido text-center py-5">
        <h1>Acceso restringido</h1>
        <p>Esta sección es solo para vendedores.</p>
        <Link to="/login" className="btn boton-perla">Iniciar sesión</Link>
      </div>
    );
  }
  return <ListaOrdenes />;
}

function ListaOrdenes() {
  const boletas = useCarga(() => ventasServicio.listar());
  const [seleccionada, setSeleccionada] = useState(null);
  const detalle = useCarga(() => (seleccionada ? ventasServicio.obtener(seleccionada) : Promise.resolve(null)), [seleccionada]);
  const lista = [...(boletas.datos ?? [])].sort((a, b) => b.id - a.id);
  const b = detalle.datos;

  return (
    <>
      <h1 className="h3">Órdenes</h1>
      <EstadoCarga cargando={boletas.cargando} error={boletas.error} />
      {!boletas.cargando && !boletas.error && lista.length === 0 && <p className="text-secondary">Aún no hay órdenes.</p>}
      {lista.length > 0 && (
        <div className="tabla-boletas table-responsive">
          <table className="table align-middle">
            <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {lista.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.fecha ? new Date(o.fecha).toLocaleString('es-CL') : ''}</td>
                  <td>{o.nombre} {o.apellidos}</td>
                  <td>{formatoCLP(o.total)}</td>
                  <td>{o.estado}</td>
                  <td><button type="button" className="btn btn-sm btn-outline-light" onClick={() => setSeleccionada(o.id)}>Ver detalle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seleccionada && (
        <section className="detalle-orden mt-4">
          <h2 className="h4">Detalle de la orden #{seleccionada}</h2>
          <EstadoCarga cargando={detalle.cargando} error={detalle.error} />
          {b && (
            <>
              <p className="mb-1">{b.nombre} {b.apellidos} · {b.correo}</p>
              <p className="mb-1">{b.calle}{b.departamento ? `, ${b.departamento}` : ''}, {b.comuna}, {b.region}</p>
              {b.indicaciones && <p className="mb-1">Indicaciones: {b.indicaciones}</p>}
              <p>Estado: {b.estado}</p>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {b.detalles.map((d) => (
                      <tr key={d.id}>
                        <td>{d.nombreProducto}</td>
                        <td>{d.cantidad}</td>
                        <td>{formatoCLP(d.precioUnitario)}</td>
                        <td>{formatoCLP(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><th colSpan="3" className="text-end">Total</th><th>{formatoCLP(b.total)}</th></tr></tfoot>
                </table>
              </div>
            </>
          )}
          <button type="button" className="btn btn-outline-light" onClick={() => setSeleccionada(null)}>Cerrar detalle</button>
        </section>
      )}
    </>
  );
}
