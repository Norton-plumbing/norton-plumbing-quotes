'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and redirect
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}>
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Norton Plumbing & Gas</h1>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary"
            style={{
              width: '100%',
              padding: '0.8rem',
              fontSize: '1rem',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
          Demo credentials will be provided after database setup
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
