'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>Norton Plumbing & Gas</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>
          Professional Quoting Platform
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link href="/login">
            <button className="primary">Login</button>
          </Link>
          <Link href="/api/health">
            <button className="secondary">Health Check</button>
          </Link>
        </div>
        
        <div style={{ marginTop: '3rem', textAlign: 'left', maxWidth: '500px', margin: '3rem auto 0' }}>
          <h2>Getting Started</h2>
          <ul style={{ lineHeight: '1.8', color: '#666' }}>
            <li>📋 <strong>Create & manage customers</strong> - Build your client database</li>
            <li>💰 <strong>Professional quotes</strong> - Add labour, materials, and equipment</li>
            <li>🧮 <strong>Live calculations</strong> - GST, markup, and profit tracking</li>
            <li>📄 <strong>PDF generation</strong> - Send professional quotes to clients</li>
            <li>👥 <strong>Role-based access</strong> - Owner, office staff, estimators, field team</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
