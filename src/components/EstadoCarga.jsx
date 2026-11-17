/** Muestra "Cargando…" o el error de una petición; si no hay ninguno de los dos, no pinta nada. */
export default function EstadoCarga({ cargando, error }) {
  if (cargando) return <p className="estado-carga text-secondary" role="status">Cargando…</p>;
  if (error) return <div className="estado-error alert alert-danger" role="alert">{error}</div>;
  return null;
}
