import { useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Inicio from './pages/Inicio.jsx';
import Productos from './pages/Productos.jsx';
import Detalle from './pages/Detalle.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Perfil from './pages/Perfil.jsx';

function RutaPrivada({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const irA = useNavigate();

  const iniciarSesion = (nuevoToken) => {
    localStorage.setItem('token', nuevoToken);
    setToken(nuevoToken);
    irA('/perfil');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setToken(null);
    irA('/login');
  };

  return (
    <>
      <nav className="menu" aria-label="Navegación principal">
        <Link to="/" className="marca">Tienda segura</Link>
        <Link to="/productos">Productos</Link>
        {token ? (
          <>
            <Link to="/perfil">Mi perfil</Link>
            <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link to="/login">Ingresar</Link>
            <Link to="/registro">Registrarse</Link>
          </>
        )}
      </nav>

      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/producto/:id" element={<Detalle />} />
          <Route path="/login" element={<Login alIniciar={iniciarSesion} />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/perfil"
            element={(
              <RutaPrivada token={token}>
                <Perfil token={token} alExpirar={cerrarSesion} />
              </RutaPrivada>
            )}
          />
          <Route path="*" element={<p>Página no encontrada</p>} />
        </Routes>
      </main>
    </>
  );
}
