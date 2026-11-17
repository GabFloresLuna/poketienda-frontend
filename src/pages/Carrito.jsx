import { useState } from 'react';
import { Link } from 'react-router-dom';
import Campo from '../components/Campo.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ventasServicio } from '../servicios/ventasServicio.js';
import { V, formatoCLP } from '../utils.js';

/** Carrito + compra: lista los productos y envía la boleta a ms-ventas, que descuenta el stock. */
export default function Carrito() {
  const { carrito, total, cambiarCantidad, quitar, vaciar, usuario } = useApp();
  const [datos, setDatos] = useState(() => ({
    nombre: usuario?.nombre ?? '',
    apellidos: usuario?.apellidos ?? '',
    correo: usuario?.correo ?? '',
    calle: usuario?.direccion ?? '',
    departamento: '',
    region: usuario?.region ?? '',
    comuna: usuario?.comuna ?? '',
    indicaciones: '',
  }));
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [boleta, setBoleta] = useState(null);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  const pagar = async (e) => {
    e.preventDefault();
    const nuevos = {
      nombre: V.requerido(datos.nombre, 'El nombre'),
      apellidos: V.requerido(datos.apellidos, 'Los apellidos'),
      correo: V.email(datos.correo),
      calle: V.requerido(datos.calle, 'La calle'),
      region: V.requerido(datos.region, 'La región'),
      comuna: V.requerido(datos.comuna, 'La comuna'),
    };
    setErrores(nuevos);
    setMensaje('');
    if (Object.values(nuevos).some(Boolean)) return;

    setEnviando(true);
    try {
      // Solo se envían el producto y la cantidad: el precio y el total los calcula el backend.
      const creada = await ventasServicio.crear({
        ...datos,
        departamento: datos.departamento.trim() || null,
        indicaciones: datos.indicaciones.trim() || null,
        items: carrito.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
      });
      vaciar();
      setBoleta(creada);
    } catch (err) {
      // 409 (sin stock) y 503 (servicio caído) traen su mensaje; el carrito se conserva.
      if (err.campos) setErrores(err.campos);
      setMensaje(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (boleta) {
    return (
      <div className="pago-aprobado alert alert-success" role="status">
        <h1 className="h4">¡Compra realizada!</h1>
        <p>Boleta #{boleta.id} · Total pagado: {formatoCLP(boleta.total)} · Estado: {boleta.estado}</p>
        <Link to="/productos" className="btn boton-perla">Seguir comprando</Link>
      </div>
    );
  }

  if (carrito.length === 0) {
    return (
      <div className="carrito-vacio text-center py-5">
        <h1>Tu carrito está vacío</h1>
        <Link to="/productos" className="btn boton-perla">Explorar productos</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="h2 mb-3">Mi carrito</h1>
      <div className="tabla-carrito table-responsive">
        <table className="table align-middle">
          <thead>
            <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
          </thead>
          <tbody>
            {carrito.map((i) => (
              <tr key={i.id}>
                <td><img src={i.img} alt="" width="48" height="48" className="imagen-carrito rounded me-2" />{i.nombre}</td>
                <td>{formatoCLP(i.precio)}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-outline-light" aria-label={`Disminuir ${i.nombre}`} onClick={() => cambiarCantidad(i.id, -1)}>−</button>
                  <span className="mx-2">{i.cantidad}</span>
                  <button type="button" className="btn btn-sm btn-outline-light" aria-label={`Aumentar ${i.nombre}`} onClick={() => cambiarCantidad(i.id, 1)}>+</button>
                </td>
                <td>{formatoCLP(i.precio * i.cantidad)}</td>
                <td><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitar(i.id)}>Quitar</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th colSpan="3" className="text-end">Total</th><th colSpan="2">{formatoCLP(total)}</th></tr>
          </tfoot>
        </table>
      </div>

      <form className="formulario-pago row g-3 mt-2" onSubmit={pagar} noValidate>
        <div className="columna-nombre col-md-4"><Campo id="nombre" etiqueta="Nombre" value={datos.nombre} onChange={cambiar} error={errores.nombre} /></div>
        <div className="columna-apellidos col-md-4"><Campo id="apellidos" etiqueta="Apellidos" value={datos.apellidos} onChange={cambiar} error={errores.apellidos} /></div>
        <div className="columna-correo col-md-4"><Campo id="correo" etiqueta="Correo" type="email" value={datos.correo} onChange={cambiar} error={errores.correo} /></div>
        <div className="columna-calle col-md-6"><Campo id="calle" etiqueta="Calle y número" value={datos.calle} onChange={cambiar} error={errores.calle} /></div>
        <div className="columna-departamento col-md-6"><Campo id="departamento" etiqueta="Departamento (opcional)" value={datos.departamento} onChange={cambiar} error={errores.departamento} /></div>
        <div className="columna-region col-md-6"><Campo id="region" etiqueta="Región" value={datos.region} onChange={cambiar} error={errores.region} /></div>
        <div className="columna-comuna col-md-6"><Campo id="comuna" etiqueta="Comuna" value={datos.comuna} onChange={cambiar} error={errores.comuna} /></div>
        <div className="columna-indicaciones col-12"><Campo id="indicaciones" etiqueta="Indicaciones (opcional)" value={datos.indicaciones} onChange={cambiar} error={errores.indicaciones} /></div>
        {mensaje && <div className="col-12"><div className="aviso-error alert alert-danger mb-0" role="alert">{mensaje}</div></div>}
        <div className="columna-botones col-12 d-flex gap-2">
          <button type="submit" className="btn boton-perla" disabled={enviando}>Pagar {formatoCLP(total)}</button>
          <button type="button" className="btn btn-outline-light" onClick={vaciar}>Vaciar carrito</button>
        </div>
      </form>
    </>
  );
}
