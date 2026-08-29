'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './quote-builder.module.css';

interface QuoteLineItem {
  id?: string;
  type: string;
  description: string;
  quantity: string;
  unit: string;
  unit_cost_ex_gst: string;
  markup_percent: string;
}

const QuoteBuilderPage = () => {
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [lines, setLines] = useState<QuoteLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLine, setNewLine] = useState<QuoteLineItem>({
    type: 'labour_plumber',
    description: '',
    quantity: '1',
    unit: 'hours',
    unit_cost_ex_gst: '88.00',
    markup_percent: '50',
  });
  const [materials, setMaterials] = useState<any[]>([]);
  const [pricingDefaults, setPricingDefaults] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch quote
        const quoteRes = await fetch(`/api/quotes/${quoteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const quoteData = await quoteRes.json();
        if (quoteData.success) {
          setQuote(quoteData.data);
          setLines(quoteData.data.lines || []);
        }

        // Fetch pricing defaults
        const pricingRes = await fetch('/api/pricing-defaults', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pricingData = await pricingRes.json();
        if (pricingData.success) {
          setPricingDefaults(pricingData.data);
          setNewLine((prev) => ({
            ...prev,
            unit_cost_ex_gst: pricingData.data.plumber_cost_per_hour,
            markup_percent: '50',
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quoteId]);

  const handleAddLine = async () => {
    if (!newLine.description) {
      alert('Please enter a description');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quote-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quote_id: quoteId,
          ...newLine,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLines([...lines, data.data]);
        setNewLine({
          type: 'labour_plumber',
          description: '',
          quantity: '1',
          unit: 'hours',
          unit_cost_ex_gst: pricingDefaults?.plumber_cost_per_hour || '88.00',
          markup_percent: '50',
        });
      }
    } catch (error) {
      console.error('Error adding line:', error);
    }
  };

  if (loading) return <div className={styles.container}><p>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <h1>Quote Builder: {quote?.quote_number}</h1>

      <div className={styles.quoteInfo}>
        <div>
          <strong>Date:</strong> {new Date(quote?.quote_date).toLocaleDateString('en-AU')}
        </div>
        <div>
          <strong>Valid until:</strong> {new Date(quote?.expiry_date).toLocaleDateString('en-AU')}
        </div>
      </div>

      <section className={styles.lineItemsSection}>
        <h2>Line Items</h2>

        {lines.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Cost</th>
                <th>Markup</th>
                <th>Total Ex GST</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.type.replace('_', ' ').toUpperCase()}</td>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td>${parseFloat(line.unit_cost_ex_gst).toFixed(2)}</td>
                  <td>{parseFloat(line.markup_percent).toFixed(0)}%</td>
                  <td>${parseFloat(line.selling_price_ex_gst || '0').toFixed(2)}</td>
                  <td>
                    <button className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.addLineForm}>
          <h3>Add Line Item</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label>Type</label>
              <select
                value={newLine.type}
                onChange={(e) => setNewLine({ ...newLine, type: e.target.value })}
              >
                <option value="labour_plumber">Plumber Labour</option>
                <option value="labour_apprentice">Apprentice Labour</option>
                <option value="material">Material</option>
                <option value="subcontractor">Subcontractor</option>
                <option value="equipment">Equipment</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label>Description</label>
              <input
                type="text"
                value={newLine.description}
                onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                placeholder="e.g., Tap replacement"
              />
            </div>
            <div>
              <label>Quantity</label>
              <input
                type="number"
                value={newLine.quantity}
                onChange={(e) => setNewLine({ ...newLine, quantity: e.target.value })}
                step="0.1"
              />
            </div>
            <div>
              <label>Unit</label>
              <input
                type="text"
                value={newLine.unit}
                onChange={(e) => setNewLine({ ...newLine, unit: e.target.value })}
                placeholder="hours, each, m, etc"
              />
            </div>
            <div>
              <label>Cost Ex GST</label>
              <input
                type="number"
                value={newLine.unit_cost_ex_gst}
                onChange={(e) => setNewLine({ ...newLine, unit_cost_ex_gst: e.target.value })}
                step="0.01"
              />
            </div>
            <div>
              <label>Markup %</label>
              <input
                type="number"
                value={newLine.markup_percent}
                onChange={(e) => setNewLine({ ...newLine, markup_percent: e.target.value })}
                step="1"
              />
            </div>
          </div>
          <button className="primary" style={{ marginTop: '1rem' }} onClick={handleAddLine}>
            Add Line
          </button>
        </div>
      </section>

      <section className={styles.totalsSection}>
        <h2>Quote Totals</h2>
        <div className={styles.totalsGrid}>
          <div>
            <strong>Direct Job Cost:</strong>
            <span>${parseFloat(quote?.direct_job_cost || '0').toFixed(2)}</span>
          </div>
          <div>
            <strong>Quote Ex GST:</strong>
            <span>${parseFloat(quote?.quote_ex_gst || '0').toFixed(2)}</span>
          </div>
          <div>
            <strong>GST (10%):</strong>
            <span>${parseFloat(quote?.gst_total || '0').toFixed(2)}</span>
          </div>
          <div className={styles.clientTotal}>
            <strong>Client Total (inc GST):</strong>
            <span>${parseFloat(quote?.client_total || '0').toFixed(2)}</span>
          </div>
          <div>
            <strong>Gross Profit:</strong>
            <span>${parseFloat(quote?.gross_profit || '0').toFixed(2)}</span>
          </div>
          <div>
            <strong>Gross Margin:</strong>
            <span className={`${styles.marginHealth} ${styles[`margin-${quote?.margin_health}`]}`}>
              {parseFloat(quote?.gross_margin_percent || '0').toFixed(1)}%
            </span>
          </div>
        </div>
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.95rem' }}>
          {quote?.margin_explanation}
        </p>
      </section>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="primary" onClick={() => router.push(`/quotes/${quoteId}/preview`)}>Preview & Send</button>
        <button className="secondary" onClick={() => router.back()}>Back</button>
      </div>
    </div>
  );
};

export default QuoteBuilderPage;
