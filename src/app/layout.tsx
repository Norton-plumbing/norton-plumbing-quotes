'use client';

import React from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Norton Plumbing & Gas - Quoting Platform</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
