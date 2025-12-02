import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hollywood Actors Graph',
  description: 'Interactive graph of Hollywood actors connected by movies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
