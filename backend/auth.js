// JWT: firma de tokens y middleware para proteger rutas.
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

if (!SECRET || SECRET.length < 16) {
  console.error('Falta JWT_SECRET (mínimo 16 caracteres) en el archivo .env');
  process.exit(1);
}

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    SECRET,
    { expiresIn: '1h', algorithm: 'HS256' },
  );
}

function auth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  try {
    req.user = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { firmarToken, auth };
