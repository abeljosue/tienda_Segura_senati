import { Link } from 'react-router-dom';

export default function Tarjeta({ id, titulo, precio }) {
  return (
    <article className="tarjeta">
      <h3>{titulo}</h3>
      <p>S/ {precio}</p>
      <Link to={`/producto/${id}`}>Ver producto</Link>
    </article>
  );
}
