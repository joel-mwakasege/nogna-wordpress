import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function NognaAdminFoundation() {
  return (
    <div className="nogna-react-foundation">
      <span>Nogna frontend foundation</span>
    </div>
  );
}

const mount = document.getElementById('nogna-react-root');

if (mount) {
  createRoot(mount).render(
    <React.StrictMode>
      <NognaAdminFoundation />
    </React.StrictMode>
  );
}
