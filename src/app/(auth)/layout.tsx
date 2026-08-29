'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <nav
        style={{
          width: '250px',
          backgroundColor: '#0066cc',
          color: 'white',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1 style={{ fontSize: '1.2rem', marginBottom: '2rem', marginTop: 0 }}>Norton Plumbing</h1>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '2rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none', display: 'block', padding: '0.75rem' }}>
              📊 Dashboard
            </Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/quotes/new" style={{ color: 'white', textDecoration: 'none', display: 'block', padding: '0.75rem' }}>
              ✏️ New Quote
            </Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/materials" style={{ color: 'white', textDecoration: 'none', display: 'block', padding: '0.75rem' }}>
              📦 Materials
            </Link>
          </li>
          {user?.role === 'owner' && (
            <li style={{ marginBottom: '0.5rem' }}>
              <Link href="/settings" style={{ color: 'white', textDecoration: 'none', display: 'block', padding: '0.75rem' }}>
                ⚙️ Settings
              </Link>
            </li>
          )}
        </ul>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.9rem', margin: 0, marginBottom: '0.5rem' }}>
            <strong>{user?.name}</strong>
          </p>
          <p style={{ fontSize: '0.85rem', color: '#ccc', margin: '0 0 1rem 0' }}>
            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
          </p>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '0.9rem',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
