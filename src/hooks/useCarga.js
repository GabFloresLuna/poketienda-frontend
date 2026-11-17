import { useCallback, useEffect, useState } from 'react';

/**
 * Ejecuta una función asíncrona al montar (y cada vez que cambian las dependencias)
 * y entrega { datos, cargando, error, codigo, recargar }.
 */
export function useCarga(funcion, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '', codigo: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    setEstado((e) => ({ ...e, cargando: true, error: '', codigo: null }));
    funcion()
      .then((datos) => activo && setEstado({ datos, cargando: false, error: '', codigo: null }))
      .catch((err) => activo && setEstado({ datos: null, cargando: false, error: err.message, codigo: err.codigo ?? null }));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { ...estado, recargar };
}
