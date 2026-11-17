import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Campo from '../components/Campo.jsx';
import { useApp } from '../context/AppContext.jsx';
import { V } from '../utils.js';

const INICIAL = { run: '', nombre: '', apellidos: '', correo: '', password: '', confirmar: '' };

/** Login y registro comparten el mismo formulario: la prop `modo` decide qué campos se muestran. */
export default function Acceso({ modo }) {
  const registro = modo === 'registro';
  const { iniciarSesion, registrar } = useApp();
  const navigate = useNavigate();
  const [valores, setValores] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setValores({ ...valores, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      correo: V.email(valores.correo),
      password: registro ? V.password(valores.password) : V.requerido(valores.password, 'La contraseña'),
    };
    if (registro) {
      nuevos.run = V.requerido(valores.run, 'El RUN');
      nuevos.nombre = V.requerido(valores.nombre, 'El nombre');
      nuevos.apellidos = V.requerido(valores.apellidos, 'Los apellidos');
      nuevos.confirmar = valores.confirmar === valores.password ? '' : 'Las contraseñas no coinciden.';
    }
    setErrores(nuevos);
    setMensaje('');
    if (Object.values(nuevos).some(Boolean)) return;

    setEnviando(true);
    try {
      const usuario = registro
        ? await registrar({ run: valores.run, nombre: valores.nombre, apellidos: valores.apellidos, correo: valores.correo, password: valores.password })
        : await iniciarSesion(valores.correo, valores.password);
      navigate(usuario.rol === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      // Los errores por campo (400) del backend se muestran junto a cada campo.
      if (err.campos) setErrores(err.campos);
      setMensaje(err.campos ? 'Revisa los datos ingresados.' : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pagina-acceso mx-auto" style={{ maxWidth: 440 }}>
      <h1 className="h2 mb-3">{registro ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      <form onSubmit={enviar} noValidate>
        {registro && <Campo id="run" etiqueta="RUN (ej. 12345678-5)" value={valores.run} onChange={cambiar} error={errores.run} />}
        {registro && <Campo id="nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar} error={errores.nombre} />}
        {registro && <Campo id="apellidos" etiqueta="Apellidos" value={valores.apellidos} onChange={cambiar} error={errores.apellidos} />}
        <Campo id="correo" etiqueta="Correo electrónico" type="email" value={valores.correo} onChange={cambiar} error={errores.correo} />
        <Campo id="password" etiqueta={registro ? 'Contraseña (6 a 72 caracteres)' : 'Contraseña'} type="password" value={valores.password} onChange={cambiar} error={errores.password} />
        {registro && <Campo id="confirmar" etiqueta="Confirmar contraseña" type="password" value={valores.confirmar} onChange={cambiar} error={errores.confirmar} />}
        {mensaje && <div className="aviso-error alert alert-danger" role="alert">{mensaje}</div>}
        <button type="submit" className="btn boton-perla w-100" disabled={enviando}>{registro ? 'Registrarme' : 'Iniciar sesión'}</button>
      </form>
      <p className="mt-3">
        {registro ? <>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></> : <>¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link></>}
      </p>
    </div>
  );
}
