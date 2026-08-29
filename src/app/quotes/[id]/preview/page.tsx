'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './preview.module.css';

const QuotePreviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/quotes/${quoteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setQuote(data.data);
          // Fetch client details
          const clientRes = await fetch(`/api/clients?search=${data.data.client_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const clientData = await clientRes.json();
          if (clientData.success && clientData.data.length > 0) {
            setClient(clientData.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quoteId]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quote?.quote_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className={styles.container}><p>Loading preview...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.previewHeader}>
        <div>
          <h1>{process.env.NEXT_PUBLIC_COMPANY_NAME}</h1>
          <p>ABN: {process.env.NEXT_PUBLIC_COMPANY_ABN}</p>
          <p>Licence: {process.env.NEXT_PUBLIC_COMPANY_LICENCE}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2>QUOTATION</h2>
          <p><strong>Quote #:</strong> {quote?.quote_number}</p>
          <p><strong>Date:</strong> {new Date(quote?.quote_date).toLocaleDateString('en-AU')}</p>
          <p><strong>Valid until:</strong> {new Date(quote?.expiry_date).toLocaleDateString('en-AU')}</p>
        </div>
      </div>

      <div className={styles.previewContent}>
        <div style={{ marginBottom: '2rem' }}>
          <h3>Bill To:</h3>
          <p>
            <strong>{client?.name}</strong><br />
            {client?.address && <>{client.address}<br /></>}
            {client?.phone && <>Phone: {client.phone}<br /></>}
            {client?.email && <>Email: {client.email}</>
          </p>
        </div>

        {quote?.scope_description && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Scope of Work:</h3>
            <p>{quote.scope_description}</p>
          </div>
        )}

        <table className={styles.lineItemsTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Price ex GST</th>
              <th>Total ex GST</th>
            </tr>
          </thead>
          <tbody>
            {quote?.lines?.map((line: any) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td>{line.quantity}</td>
                <td>{line.unit}</td>
                <td>${parseFloat(line.selling_price_ex_gst).toFixed(2)}</td>
                <td>${parseFloat(line.selling_price_ex_gst).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal (ex GST):</span>
            <span>${parseFloat(quote?.quote_ex_gst || '0').toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>GST (10%):</span>
            <span>${parseFloat(quote?.gst_total || '0').toFixed(2)}</span>
          </div>
          <div className={styles.totalRowLarge}>
            <span>Total (inc GST):</span>
            <span>${parseFloat(quote?.client_total || '0').toFixed(2)}</span>
          </div>
        </div>

        {quote?.conditions && (
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h3>Terms & Conditions:</h3>
            <p>{quote.conditions}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        <button className="primary" onClick={handleDownloadPDF} disabled={downloading}>
          {downloading ? 'Generating PDF...' : '📥 Download PDF'}
        </button>
        <button className="secondary" onClick={() => router.back()}>
          Back
        </button>
      </div>
    </div>
  );
};

export default QuotePreviewPage;
