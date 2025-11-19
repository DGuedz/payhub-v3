import React from 'react';
import { createRoot } from 'react-dom/client';
import { LiquidarParceladoForm } from '../components/LiquidarParceladoForm';

function App() {
  return (
    <main style={{ maxWidth: 800, margin: '24px auto', padding: '0 16px' }}>
      <LiquidarParceladoForm />
    </main>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}