import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wikipedia MCP Server',
  description: 'Model Context Protocol server for Wikipedia',
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
