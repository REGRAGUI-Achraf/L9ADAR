import { useEffect, useState } from 'react';

// A small end-to-end check: browser -> gateway -> backend -> database.
export function App() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('/api/health/ready')
      .then((r) => setStatus(r.ok ? 'backend ready' : `backend answered ${r.status}`))
      .catch(() => setStatus('backend unreachable'));
  }, []);

  return (
    <main>
      <h1>L9aDar</h1>
      <p>{status}</p>
    </main>
  );
}
