import { useEffect, useState } from 'react';
import { request } from '../api.js';

export default function Perfil({ token, alExpirar }) {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    request('/perfil', { token })
      .then((datos) => activo && setPerfil(datos))
      .catch((err) => {
        if (activo) {
          setError(err.message);
          alExpirar();
        }
      });

    return () => { activo = false; };
  }, [token, alExpirar]);

  if (error) return <p className="error">{error}</p>;
  if (!perfil) return <p>Cargando perfil...</p>;

  return (
    <div className="detalle">
      <h1>Hola, {perfil.nombre}</h1>
      <p>Correo: {perfil.email}</p>
      <p>Tu sesión expira: {new Date(perfil.expira * 1000).toLocaleString()}</p>
      <small>Esta información viene de /api/perfil, una ruta protegida con JWT.</small>
    </div>
  );
}
