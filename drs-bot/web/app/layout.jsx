import './globals.css';

export const metadata = {
  title: 'DRS Bot — Roadmap Engine',
  description: 'Data-driven DRS implementation roadmap per geography',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
