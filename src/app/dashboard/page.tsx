'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  status: string;
  quote_ex_gst: number;
  created_at: string;
}

const DashboardPage = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
  });

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch recent quotes
    const fetchQuotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/quotes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.success) {
          setQuotes(data.data.slice(0, 5));

          // Calculate stats
          const newStats = { draft: 0, sent: 0, accepted: 0, declined: 0 };
          data.data.forEach((q: Quote) => {
            if (q.status in newStats) {
              newStats[q.status as keyof typeof newStats]++;
            }
          });
          setStats(newStats);
        }
      } catch (error) {
        console.error('Failed to fetch quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
        </div>
        <button className="primary" style={{ marginTop: 0 }}>
          <Link href="/quotes/new" style={{ textDecoration: 'none', color: 'white' }}>
            + New Quote
          </Link>
        </button>
      </header>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <h3>{stats.draft}</h3>
          <p>Draft Quotes</p>
        </div>
        <div className={styles.stat}>
          <h3>{stats.sent}</h3>
          <p>Sent</p>
        </div>
        <div className={styles.stat}>
          <h3>{stats.accepted}</h3>
          <p>Accepted</p>
        </div>
        <div className={styles.stat}>
          <h3>{stats.declined}</h3>
          <p>Declined</p>
        </div>
      </div>

      <section>
        <h2>Recent Quotes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : quotes.length === 0 ? (
          <div className="card">
            <p>No quotes yet. <Link href="/quotes/new">Create your first quote</Link></p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <Link href={`/quotes/${quote.id}`}>{quote.quote_number}</Link>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge-${quote.status}`]}`}>
                      {quote.status.toUpperCase()}
                    </span>
                  </td>
                  <td>${parseFloat(quote.quote_ex_gst as any).toFixed(2)}</td>
                  <td>{new Date(quote.created_at).toLocaleDateString('en-AU')}</td>
                  <td>
                    <Link href={`/quotes/${quote.id}`}>
                      <button className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
