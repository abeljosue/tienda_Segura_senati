import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api.js';

export default function Registro() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const irA = useNavigate();

  const cambiar = (event) => {
    setForm((actual) => ({ ...actual, [event.target.name]: event.target.value }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (form.nombre.trim().length < 2) nuevosErrores.nombre = 'Mínimo 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nuevosErrores.email = 'Correo inválido';
    if (form.password.length < 6) nuevosErrores.password = 'Mínimo 6 caracteres';
    return nuevosErrores;
  };

  const enviar = async (event) => {
    event.preventDefault();
    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    setMensaje('');
    if (Object.keys(nuevosErrores).length) return;

    try {
      await request('/register', { method: 'POST', body: form });
      setMensaje('Cuenta creada. Redirigiendo al login...');
      setTimeout(() => irA('/login'), 1200);
    } catch (error) {
      setErrores({ general: error.message });
    }
  };

  return (
    <form onSubmit={enviar} className="formulario" noValidate>
      <h1>Registro</h1>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" name="nombre" value={form.nombre} onChange={cambiar} />
      {errores.nombre && <small className="error">{errores.nombre}</small>}
      <label htmlFor="email">Correo</label>
      <input id="email" name="email" type="email" value={form.email} onChange={cambiar} />
      {errores.email && <small className="error">{errores.email}</small>}
      <label htmlFor="password">Contraseña</label>
      <input id="password" name="password" type="password" value={form.password} onChange={cambiar} />
      {errores.password && <small className="error">{errores.password}</small>}
      {errores.general && <p className="error">{errores.general}</p>}
      {mensaje && <p className="ok">{mensaje}</p>}
      <button type="submit">Crear cuenta</button>
    </form>
  );
}
