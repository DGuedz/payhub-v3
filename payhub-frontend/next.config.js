/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desabilitado para evitar conflitos de resolução/versão (React 18 vs 19)
  // experimental: { externalDir: true }
};

module.exports = nextConfig;