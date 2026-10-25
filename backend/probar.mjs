const BASE = process.env.API || 'http://localhost:3000';
const ORIGEN = process.env.FRONTEND_ORIGEN || 'http://localhost:5173';
let fallos = 0;

const verificar = (nombre, condicion, detalle = '') => {
  console.log(`${condicion ? '✅' : '❌'} ${nombre}${detalle ? `  →  ${detalle}` : ''}`);
  if (!condicion) fallos += 1;
};

const post = (ruta, body, token) =>
  fetch(BASE + ruta, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

const email = `alumno${Date.now()}@correo.com`;
console.log(`\nProbando ${BASE}\n`);

let response = await post('/api/register', {
  nombre: 'Alumno Prueba',
  email,
  password: 'secreto123',
});
verificar('Registro de usuario (201)', response.status === 201);

response = await post('/api/login', { email, password: 'incorrecta' });
verificar('Login con clave incorrecta es rechazado (401)', response.status === 401);

response = await post('/api/login', { email, password: 'secreto123' });
const { token } = await response.json();
verificar('Login correcto entrega un JWT', response.status === 200 && token?.split('.').length === 3);

const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
verificar(
  'El payload trae id, email y exp',
  payload.id && payload.email === email && payload.exp,
  JSON.stringify(payload),
);

response = await fetch(BASE + '/api/perfil');
verificar('/perfil sin token (401)', response.status === 401);

response = await fetch(BASE + '/api/perfil', {
  headers: { Authorization: `Bearer ${token}x` },
});
verificar('/perfil con token alterado (401)', response.status === 401);

response = await fetch(BASE + '/api/perfil', {
  headers: { Authorization: `Bearer ${token}` },
});
verificar('/perfil con token válido (200)', response.status === 200);

const inyeccion = "' OR '1'='1";
response = await post('/api/login', { email: inyeccion, password: 'x' });
verificar('SQL Injection en login NO funciona', response.status === 400 || response.status === 401, `HTTP ${response.status}`);

response = await fetch(`${BASE}/api/productos?q=${encodeURIComponent(inyeccion)}`);
const lista = await response.json();
verificar('SQL Injection en búsqueda: se trata como texto (0 resultados)', Array.isArray(lista) && lista.length === 0);

response = await fetch(`${BASE}/buscar?q=${encodeURIComponent('<script>robarDatos()</script>')}`);
const html = await response.text();
verificar('XSS: la salida se escapa', !html.includes('<script>') && html.includes('&lt;script&gt;'), html);
verificar('Helmet agrega cabeceras seguras', response.headers.get('x-content-type-options') === 'nosniff');

response = await fetch(BASE + '/api/perfil', {
  method: 'OPTIONS',
  headers: {
    Origin: ORIGEN,
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization',
  },
});
verificar('CORS permite el origen del frontend', response.headers.get('access-control-allow-origin') === ORIGEN);

response = await fetch(BASE + '/api/perfil', {
  method: 'OPTIONS',
  headers: { Origin: 'http://sitio-malo.com', 'Access-Control-Request-Method': 'GET' },
});
verificar('CORS NO permite un origen ajeno', response.headers.get('access-control-allow-origin') !== 'http://sitio-malo.com');

console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodo correcto');
process.exit(fallos ? 1 : 0);
