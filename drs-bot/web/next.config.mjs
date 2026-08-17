import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep pdf-parse (and its bundled pdfjs worker) OUT of the server bundle so
  // its worker file resolves from node_modules at runtime instead of a missing
  // .next/server/chunks/pdf.worker.mjs. Fixes "Setting up fake worker failed".
  serverExternalPackages: ['pdf-parse'],
  turbopack: {
    root: resolve(__dirname, '../..'),
  },
};

export default nextConfig;
