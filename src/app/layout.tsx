import type { Metadata, Viewport } from 'next';
import '../styles.css';
export const metadata: Metadata = {
  title: 'Snackyzz | Un antojo. Tres formas de caer.',
  description: 'Elige tus cookies favoritas, arma tu antojo y encuentra los puntos de venta de Snackyzz.',
  icons: { icon: '/assets/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#F9EDE0' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}<noscript>Activa JavaScript para ver las cookies y gestionar tu carrito. También puedes escribirnos a Snackyzz.cookies@gmail.com.</noscript></body></html>;
}
