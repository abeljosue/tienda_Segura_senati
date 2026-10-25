import { useState } from 'react';

export default function Contador() {
  const [n, setN] = useState(0);

  return <button type="button" onClick={() => setN((actual) => actual + 1)}>Clics: {n}</button>;
}
