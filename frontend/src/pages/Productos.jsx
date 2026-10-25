import { useEffect, useRef, useState } from 'react';
import Tarjeta from '../components/Tarjeta.jsx';
import { request } from '../api.js';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [q, setQ] = useState('');
  const [versionBusqueda, setVersionBusqueda] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const campo = useRef(null);

  useEffect(() => {
    let activo = true;

    request(`/productos?q=${encodeURIComponent(q)}`)
      .then((datos) => {
        if (activo) {
          setProductos(datos);
          setError('');
        }
      })
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));

    return () => { activo = false; };
  }, [q, versionBusqueda]);

  const buscar = (event) => {
    event.preventDefault();
    setCargando(true);
    setQ(campo.current.value);
    setVersionBusqueda((version) => version + 1);
  };

  return (
    <>
      <h1>Productos</h1>
      <form onSubmit={buscar} className="fila">
        <input ref={campo} placeholder="Buscar producto..." aria-label="Buscar producto" />
        <button type="submit">Buscar</button>
      </form>
      {q && <p>Resultados para: {q}</p>}
      {cargando && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
      {!cargando && !error && productos.length === 0 && <p>Sin resultados.</p>}
      <div className="rejilla">
        {productos.map((producto) => (
          <Tarjeta key={producto.id} id={producto.id} titulo={producto.nombre} precio={producto.precio} />
        ))}
      </div>
    </>
  );
}
