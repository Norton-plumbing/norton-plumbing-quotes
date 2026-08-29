'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './new-quote.module.css';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

const NewQuotePage = () => {
  const router = useRouter();
  const [step, setStep] = useState<'client' | 'details' | 'confirm'>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    postcode: '',
    state: 'SA',
  });
  const [quoteDetails, setQuoteDetails] = useState({
    job_type: '',
    address: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name) {
      alert('Please enter client name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClient),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedClient(data.data);
        setStep('details');
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedClient || !quoteDetails.job_type) {
      alert('Please fill in all details');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: selectedClient.id,
          quote_date: new Date().toISOString().split('T')[0],
          validity_days: 30,
          scope_description: quoteDetails.job_type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCreatedQuoteId(data.data.id);
        setStep('confirm');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error creating quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Create New Quote</h1>

      {step === 'client' && (
        <div className={styles.card}>
          <h2>Step 1: Select or Create Customer</h2>

          {clients.length > 0 && (
            <div className={styles.section}>
              <h3>Existing Customers</h3>
              <div className={styles.clientList}>
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`${styles.clientCard} ${selectedClient?.id === client.id ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedClient(client);
                      setStep('details');
                    }}
                  >
                    <strong>{client.name}</strong>
                    {client.phone && <p>{client.phone}</p>}
                    {client.address && <p>{client.address}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3>Create New Customer</h3>
            <div className={styles.formGrid}>
              <input
                type="text"
                placeholder="Full Name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
              <input
                type="text"
                placeholder="Address"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
              />
              <input
                type="text"
                placeholder="Suburb"
                value={newClient.suburb}
                onChange={(e) => setNewClient({ ...newClient, suburb: e.target.value })}
              />
              <input
                type="text"
                placeholder="Postcode"
                value={newClient.postcode}
                onChange={(e) => setNewClient({ ...newClient, postcode: e.target.value })}
              />
            </div>
            <button className="primary" onClick={handleCreateClient}>
              Create Customer & Continue
            </button>
          </div>
        </div>
      )}

      {step === 'details' && selectedClient && (
        <div className={styles.card}>
          <h2>Step 2: Job Details</h2>
          <p>Customer: <strong>{selectedClient.name}</strong></p>

          <div className={styles.formGrid}>
            <div>
              <label>Job Type *</label>
              <input
                type="text"
                placeholder="e.g., Tap Replacement, New Installation"
                value={quoteDetails.job_type}
                onChange={(e) => setQuoteDetails({ ...quoteDetails, job_type: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Job Address</label>
              <input
                type="text"
                placeholder="Address"
                value={quoteDetails.address}
                onChange={(e) => setQuoteDetails({ ...quoteDetails, address: e.target.value })}
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                type="tel"
                placeholder="Phone"
                value={quoteDetails.phone}
                onChange={(e) => setQuoteDetails({ ...quoteDetails, phone: e.target.value })}
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="Email"
                value={quoteDetails.email}
                onChange={(e) => setQuoteDetails({ ...quoteDetails, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="primary" onClick={handleCreateQuote} disabled={loading}>
              {loading ? 'Creating Quote...' : 'Create Quote'}
            </button>
            <button className="secondary" onClick={() => setStep('client')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && createdQuoteId && (
        <div className={styles.card}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>✅ Quote Created Successfully!</h2>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
              Your quote is ready to build. Add line items, review margins, and send to the customer.
            </p>

            <button
              className="primary"
              onClick={() => router.push(`/quotes/${createdQuoteId}/builder`)}
              style={{ marginRight: '1rem' }}
            >
              Build Quote
            </button>
            <button className="secondary" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewQuotePage;
