'use client';

import React, { useState, useEffect } from 'react';
import styles from './settings.module.css';

interface PricingDefaults {
  plumber_cost_per_hour: number;
  plumber_sell_rate_per_hour: number;
  apprentice_cost_per_hour: number;
  apprentice_sell_rate_per_hour: number;
  material_markup_percent: number;
  subcontractor_markup_percent: number;
  equipment_markup_percent: number;
}

const SettingsPage = () => {
  const [pricing, setPricing] = useState<PricingDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check user role
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'owner') {
        setMessage('Only owners can access settings');
        return;
      }
    }

    fetchPricingDefaults();
  }, []);

  const fetchPricingDefaults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pricing-defaults', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setPricing(data.data);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PricingDefaults, value: string) => {
    if (pricing) {
      setPricing({
        ...pricing,
        [field]: parseFloat(value),
      });
    }
  };

  const handleSave = async () => {
    if (!pricing) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pricing-defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricing),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✅ Pricing updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error updating pricing');
      }
    } catch (error) {
      setMessage('❌ Error saving changes');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'owner') {
    return (
      <div className={styles.container}>
        <div className="alert alert-error">{message}</div>
      </div>
    );
  }

  if (loading) return <div className={styles.container}><p>Loading settings...</p></div>;

  return (
    <div className={styles.container}>
      <h1>Settings</h1>

      {message && (
        <div className={message.includes('✅') ? 'alert alert-success' : 'alert alert-error'} style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <div className={styles.card}>
        <h2>Labour Costs & Rates</h2>

        <div className={styles.formGrid}>
          <div>
            <label>Plumber Cost Per Hour (ex GST)</label>
            <input
              type="number"
              value={pricing?.plumber_cost_per_hour || ''}
              onChange={(e) => handleChange('plumber_cost_per_hour', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label>Plumber Sell Rate Per Hour (ex GST)</label>
            <input
              type="number"
              value={pricing?.plumber_sell_rate_per_hour || ''}
              onChange={(e) => handleChange('plumber_sell_rate_per_hour', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label>Apprentice Cost Per Hour (ex GST)</label>
            <input
              type="number"
              value={pricing?.apprentice_cost_per_hour || ''}
              onChange={(e) => handleChange('apprentice_cost_per_hour', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label>Apprentice Sell Rate Per Hour (ex GST)</label>
            <input
              type="number"
              value={pricing?.apprentice_sell_rate_per_hour || ''}
              onChange={(e) => handleChange('apprentice_sell_rate_per_hour', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2>Markup Percentages</h2>

        <div className={styles.formGrid}>
          <div>
            <label>Material Markup %</label>
            <input
              type="number"
              value={pricing?.material_markup_percent || ''}
              onChange={(e) => handleChange('material_markup_percent', e.target.value)}
              step="0.1"
              min="0"
            />
            <small>Applied to material costs</small>
          </div>

          <div>
            <label>Subcontractor Markup %</label>
            <input
              type="number"
              value={pricing?.subcontractor_markup_percent || ''}
              onChange={(e) => handleChange('subcontractor_markup_percent', e.target.value)}
              step="0.1"
              min="0"
            />
            <small>Applied to subcontractor costs</small>
          </div>

          <div>
            <label>Equipment Markup %</label>
            <input
              type="number"
              value={pricing?.equipment_markup_percent || ''}
              onChange={(e) => handleChange('equipment_markup_percent', e.target.value)}
              step="0.1"
              min="0"
            />
            <small>Applied to equipment hire</small>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
