// Cliente centralizado: añade el JWT y concentra el manejo de errores HTTP.
const API = 'http://localhost:3000/api';

export async function request(ruta, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${ruta}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}
