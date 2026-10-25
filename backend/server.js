const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const escape = require('escape-html');

const db = require('./db');
const { firmarToken, auth } = require('./auth');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ORIGEN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Seguridad global: cabeceras, origen permitido y límite de entrada.
app.use(helmet());
app.use(
  cors({
    origin: ORIGEN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '10kb' }));

const emailValido = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Autenticación: registro, login y perfil protegido.
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body || {};

    if (typeof nombre !== 'string' || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existe = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existe) {
      return res.status(409).json({ error: 'Ese correo ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)').run(
      nombre.trim(),
      email,
      hash,
    );

    return res.status(201).json({ mensaje: 'Usuario creado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!emailValido(email) || typeof password !== 'string') {
      return res.status(400).json({ error: 'Correo o contraseña inválidos' });
    }

    const usuario = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const credencialesValidas =
      usuario && (await bcrypt.compare(password, usuario.password));

    if (!credencialesValidas) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = firmarToken(usuario);
    return res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/perfil', auth, (req, res) => {
  const usuario = db
    .prepare('SELECT id, nombre, email FROM users WHERE id = ?')
    .get(req.user.id);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  return res.json({ ...usuario, expira: req.user.exp });
});

// Productos: lectura pública y creación protegida por JWT.
app.get('/api/productos', (req, res) => {
  const q = String(req.query.q || '').slice(0, 50);
  const productos = db
    .prepare('SELECT * FROM productos WHERE nombre LIKE ? ORDER BY id')
    .all(`%${q}%`);

  return res.json(productos);
});

app.get('/api/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  const producto = Number.isInteger(id)
    ? db.prepare('SELECT * FROM productos WHERE id = ?').get(id)
    : null;

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  return res.json(producto);
});

app.post('/api/productos', auth, (req, res) => {
  const { nombre, precio, descripcion = '' } = req.body || {};

  if (typeof nombre !== 'string' || nombre.trim().length < 2) {
    return res.status(400).json({ error: 'Nombre inválido' });
  }
  if (typeof precio !== 'number' || !Number.isFinite(precio) || !(precio > 0)) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  const result = db
    .prepare('INSERT INTO productos (nombre, precio, descripcion) VALUES (?, ?, ?)')
    .run(nombre.trim(), precio, String(descripcion).slice(0, 300));

  return res.status(201).json({
    id: Number(result.lastInsertRowid),
    nombre: nombre.trim(),
    precio,
    descripcion: String(descripcion).slice(0, 300),
  });
});

// Salida HTML segura: la entrada se escapa antes de reflejarse.
app.get('/buscar', (req, res) => {
  const q = String(req.query.q || '');
  return res.send(`<h1>Resultados para: ${escape(q)}</h1>`);
});

// Demos intencionalmente vulnerables, activas solo durante la práctica.
if (process.env.DEMO_INSEGURO === 'true') {
  app.get('/demo/usuarios-inseguro', (req, res) => {
    const email = req.query.email || '';
    const sql = `SELECT id, nombre, email FROM users WHERE email = '${email}'`;

    try {
      return res.json({ sql, resultado: db.prepare(sql).all() });
    } catch (error) {
      return res.status(400).json({ sql, error: error.message });
    }
  });

  app.get('/demo/buscar-inseguro', (req, res) => {
    return res.type('html').send(`<h1>Resultados para: ${req.query.q || ''}</h1>`);
  });
}

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Error del servidor' });
});

app.listen(PORT, () => {
  console.log(`API lista en http://localhost:${PORT}`);
});
